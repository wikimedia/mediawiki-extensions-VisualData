/**
 * This file is part of the MediaWiki extension VisualData.
 *
 * VisualData is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * VisualData is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VisualData. If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright © 2023, https://wikisphere.org
 */

/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */

const VisualDataProcessModel = function (
	callbackShowError,
	Form,
	Schemas,
	InitialSchemas,
	Model,
	ModelSchemas,
	makeElementId
) {
	var Flatten;
	var Action;
	var Removed;
	var Errors;

	async function getValue( model ) {
		var value = 'getValue' in model.input ? model.input.getValue() : '';

		if ( VisualDataFunctions.isPromise( value ) ) {
			value = await value;
		}

		if ( 'validateFunc' in model.input ) {
			var errorMsg = model.input.validateFunc();
			if ( VisualDataFunctions.isPromise( errorMsg ) ) {
				errorMsg = await errorMsg;
			}
			if ( typeof errorMsg === 'string' ) {
				throw new Error( errorMsg );
			}
		}

		if ( Array.isArray( value ) ) {
			value = value.map( ( x ) => castType( x, model ) );
		} else {
			value = castType( value, model );
		}

		return value;
	}

	function castType( value, model ) {
		// *** this is an hack to prevent
		// empty string, alternatively
		// use required native validation
		// or "minLength": 1

		if ( model.schema.wiki.required ) {
			switch ( model.schema.type ) {
				case 'number':
				case 'string':
					// value can be undefined for OO.ui.SelectFileWidget
					if ( !value || ( typeof value === 'string' && value.trim() === '' ) ) {
						return null;
					}
					break;
			}
		}

		return VisualDataFunctions.castType( value, model.schema.type );
	}

	async function formatValue( path, model ) {
		var path_ = ( Action === 'submit' ? path : model.path );

		if ( !( 'input' in model ) ) {
			// eslint-disable-next-line no-console
			console.error( 'input does not exist', path, model );
			return;
		}

		var value = 'getValue' in model.input ? model.input.getValue() : '';

		if ( model.removed ) {
			return value;
		}

		if ( VisualDataFunctions.isPromise( value ) ) {
			value = await value;
		}

		if ( 'validateFunc' in model.input ) {
			var errorMsg = model.input.validateFunc();
			if ( VisualDataFunctions.isPromise( errorMsg ) ) {
				errorMsg = await errorMsg;
			}
			if ( typeof errorMsg === 'string' ) {
				Errors[ path_ ] = errorMsg;
			}
		}

		if ( Array.isArray( value ) ) {
			value = value.map( ( x ) => castType( x, model ) );
		} else {
			value = castType( value, model );
		}

		Flatten[ path_ ] = {
			pathNoIndex: model.pathNoIndex,
			value: value,
			multiselect: model.multiselect,
			schema: model.schema
		};

		if ( model.isFile ) {
			Flatten[ path_ ].filekey = model.filekey;
			// Flatten[model.path].previousFilaneme = model.previousFilaneme;
		}

		return value;
	}

	function validate( schemaName, data, schema ) {
		var errors = Errors;
		// eslint-disable-next-line new-cap
		const ajv = new window.ajv7( { strict: false, allErrors: true } );

		ajv.addFormat( 'email', {
			type: 'string',
			validate: ( value ) => ( !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( value ) )
		} );

		ajv.addFormat( 'url', {
			type: 'string',
			validate: ( value ) => ( !value || /^(https?:\/\/[^\s/$.?#][^\s]*)$/.test( value ) )
		} );

		var validateAjv;
		try {
			validateAjv = ajv.compile( schema );

		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( 'validate', e );
			callbackShowError( schemaName, e.message );

			// @MAYBETODO
			// add: "please report the issue in the talk page
			// of the extension"
			return false;
		}
		if ( validateAjv( data ) && !Object.keys( errors ).length ) {
			return true;
		}

		var hiddenErrors = {};
		if ( 'errors' in validateAjv && Array.isArray( validateAjv.errors ) ) {
			var AjvErrors = [];

			// pre-process errors
			// @see https://ajv.js.org/api.html
			for ( var error of validateAjv.errors ) {
				switch ( error.keyword ) {
					case 'uniqueItems':
						if ( Removed.indexOf( `${ VisualDataFunctions.escapeJsonPointer( schemaName ) }${ error.instancePath }/${ error.params.j }` ) === -1 ) {
							AjvErrors.push( $.extend( VisualDataFunctions.deepCopy( error ), { instancePath: `${ error.instancePath }/${ error.params.i }` } ) );
						}
						if ( Removed.indexOf( `${ VisualDataFunctions.escapeJsonPointer( schemaName ) }${ error.instancePath }/${ error.params.i }` ) === -1 ) {
							AjvErrors.push( $.extend( VisualDataFunctions.deepCopy( error ), { instancePath: `${ error.instancePath }/${ error.params.j }` } ) );
						}
						break;
					default:
						AjvErrors.push( error );
				}
			}
			loopA: for ( var error of AjvErrors ) {
				var path = `${ VisualDataFunctions.escapeJsonPointer( schemaName ) }${ error.instancePath }`;

				// check if multiselect
				// @FIXME add specific reference to arrays
				if ( !( path in Flatten ) && /\/\d+$/.test( path ) ) {
					var path_ = path.split( '/' ).slice( 0, -1 ).join( '/' );

					if ( ( path_ in Flatten ) &&
						( 'multiselect' in Flatten[ path_ ] ) &&
						Flatten[ path_ ].multiselect === true
					) {
						path = path_;
					}
				}

				for ( var path_ of Removed ) {
					if ( path === path_ ||
						// @FIXME add specific reference to arrays
						( /\/\d+$/.test( path_ ) && path.indexOf( path_ ) === 0 ) ) {
						continue loopA;
					}
				}

				// eslint-disable-next-line no-console
				console.error( error );

				if ( !( path in Flatten ) ) {
					hiddenErrors[ path ] = `${ error.instancePath.slice( 1 ) } ${ error.message }`;
					continue;
				}

				// ignore NaN values if the field is not required
				if ( VisualDataFunctions.isNaN( Flatten[ path ].value ) && !Flatten[ path ].schema.wiki.required ) {
					continue;
				}

				if ( !$( '#' + jQuery.escapeSelector( makeElementId( path ) ) ).is( ':visible' ) ) {
					hiddenErrors[ path ] = `${ Flatten[ path ].schema.wiki.name } ${ error.message }`;
				}

				errors[ path ] = error.message;
			}
		}

		if ( !Object.keys( errors ).length && !Object.keys( hiddenErrors ).length ) {
			return true;
		}

		callbackShowError( schemaName, null, errors, hiddenErrors );
		return false;
	}

	async function getValuesRec( path, model ) {
		switch ( model.schema.type ) {
			case 'array':
				// @TODO handle tuple
				if ( !VisualDataFunctions.isObject( model.items ) ) {
					return [];
				}
				var items = [];

				// multiselect
				if ( 'schema' in model.items ) {
					items = await formatValue( path, model.items );

				} else {
					var n = 0;
					for ( var ii in model.items ) {
						var path_ = `${ path }/${ n }`;
						if ( model.items[ ii ].removed ) {
							if ( Action !== 'validate' ) {
								continue;
							} else {
								Removed.push( path_ );
							}
						}
						items.push( await getValuesRec( path_, model.items[ ii ] ) );
						n++;
					}
				}
				/* set to null only required items */
				for ( var ii in items ) {
					if (
						typeof items[ ii ] === 'string' &&
						items[ ii ].trim() === '' &&
						'minItems' in model.schema &&
						ii <= model.schema.minItems
					) {
						items[ ii ] = null;
					}
				}
				return items;

			case 'object':
				var items = {};
				for ( var ii in model.properties ) {
					var path_ = `${ path }/${ VisualDataFunctions.escapeJsonPointer( ii ) }`;

					if ( model.properties[ ii ].removed ) {
						if ( Action !== 'validate' ) {
							continue;
						} else {
							Removed.push( path_ );
						}
					}

					items[ ii ] = await getValuesRec( path_, model.properties[ ii ] );
				}
				return items;

			default:
				return await formatValue( path, model );
		}
	}

	async function getFormModel() {
		var ret = {};
		for ( var i in Model ) {
			ret[ i ] = Model[ i ].getValue();

			if ( VisualDataFunctions.isPromise( ret[ i ] ) ) {
				ret[ i ] = await ret[ i ];
			}
		}
		return ret;
	}

	async function getModel( action, schemaName ) {
		Action = action;
		Flatten = {};
		Removed = [];
		Errors = {};

		var ret = {};
		switch ( action ) {
			case 'validate':
				callbackShowError( null );

				try {
					for ( var schemaName in ModelSchemas ) {
						if ( Form.schemas.indexOf( schemaName ) === -1 ) {
							continue;
						}
						ret[ schemaName ] = await getValuesRec(
							VisualDataFunctions.escapeJsonPointer( schemaName ),
							ModelSchemas[ schemaName ]
						);
						// removeNulls(ret);

						if ( !validate( schemaName, ret[ schemaName ], Schemas[ schemaName ] ) ) {
							return false;
						}
					}
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( 'validate', e );
					return false;
				}
				return ret;

			case 'fetch':
				for ( var schemaName in ModelSchemas ) {
					ret[ schemaName ] = await getValuesRec(
						VisualDataFunctions.escapeJsonPointer( schemaName ),
						ModelSchemas[ schemaName ]
					);
				}
				return ret;

			case 'submit':
				for ( var schemaName in ModelSchemas ) {
					if ( Form.schemas.indexOf( schemaName ) === -1 ) {
						continue;
					}
					ret[ schemaName ] = await getValuesRec(
						VisualDataFunctions.escapeJsonPointer( schemaName ),
						ModelSchemas[ schemaName ]
					);
				}
				var formModel = await getFormModel();

				return {
					data: ret,
					flatten: Flatten,
					form: formModel,
					schemas: Form.schemas,
					// @FIXME or retrieve it server side
					options: Form.options,
					initialSchemas: InitialSchemas
				};

			case 'validate&submit':
				Action = 'validate';

				if ( !( await getModel( 'validate' ) ) ) {
					return false;
				}
				Action = 'submit';
				return await getModel( 'submit' );

			case 'delete':
				var formModel = await getFormModel();
				Form.options.action = 'delete';
				return {
					form: formModel,
					options: Form.options,
					schemas: InitialSchemas // Object.keys(ModelSchemas),
				};

			case 'schema':
				if ( !( schemaName in ModelSchemas ) ) {
					return false;
				}

				var ret = await getValuesRec(
					VisualDataFunctions.escapeJsonPointer( schemaName ),
					ModelSchemas[ schemaName ]
				);
				return {
					data: ret,
					flatten: Flatten
				};
		}
	}

	return {
		getModel,
		getValue
	};
};
