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
 * @copyright Copyright © 2021-2023, https://wikisphere.org
 */

/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable es-x/no-async-functions */
/* eslint-disable compat/compat */

const VisualDataForms = function ( Config, Form, FormID, Schemas, WindowManager ) {
	var Model = {};
	var ModelSchemas;
	var OuterStack;
	var PropertiesStack;
	var processDialogSearch;
	var DialogSearchName = 'dialogSearch';
	var ToolbarMain;
	var ActionToolbarMain;
	var ActionWidget;
	var SubmitButton;
	var ValidateButton;
	var GoBackButton;
	// var DeleteButton;
	// shallow copy
	var RecordedSchemas = Form.schemas.slice();
	var Fields;
	var DialogName = 'dialogForm';
	var StoredJsonData = VisualDataFunctions.deepCopy( Form.jsonData );
	var ModelFlatten = [];
	var SelectedSchema;
	var PreviousSchemas = {};
	var ProcessModel = {};
	var InputWidgets;
	var SchemasLayout;
	var Initialized = false;
	var PendingRecursive;
	var QueuedWidgets = [];
	var Maps = [];
	var TargetSlotField;

	function inArray( val, arr ) {
		return arr.indexOf( val ) !== -1;
	}

	function escapeJsonPtr( str ) {
		return VisualDataFunctions.escapeJsonPtr( str );
	}

	// @FIXME destroy/reinitialize on tab change
	function showVisualEditor() {
		function timeOut( i ) {
			setTimeout( function () {
				if (
					InputWidgets[ i ] &&
					InputWidgets[ i ].$element.parent().is( ':visible' )
				) {
					InputWidgets[ i ].initialize();
				}
			}, 100 );
		}

		// @IMPORTANT use "let" with timeout !!
		for ( let i in InputWidgets ) {
			var constructorName = InputWidgets[ i ].constructorName || InputWidgets[ i ].constructor.name;
			if ( constructorName === 'VisualDataVisualEditor' ||
				( 'constructorName' in InputWidgets[ i ] &&
					InputWidgets[ i ].constructorName === 'VisualDataVisualEditor' )
			) {
				timeOut( i );
			}
		}
	}

	function loadMaps() {
		function timeOut( obj ) {
			// setTimeout( function () {
			// @FIXME find a better way
			var schemaName = obj.data.path.split( '/' )[ 0 ];
			// if ( obj.element.is( ':visible' ) ) {
			if ( schemaName === SelectedSchema ) {
				if ( obj.data.schema.wiki.coordinates === false ) {
					var latFieldId = makeElementId( `${ obj.data.path }/latitude` );
					var lonFieldId = makeElementId( `${ obj.data.path }/longitude` );
					var escapeSelector = jQuery.escapeSelector;

					for ( let fieldId of [ latFieldId, lonFieldId ] ) {
						let callbackCond = function () {
							return $( '#' + escapeSelector( fieldId ) ).length;
						};
						let callback = function ( resolve, reject ) {
							$( '#' + escapeSelector( fieldId ) ).hide();
							resolve();
						};
						let callbackMaxAttempts = function ( resolve, reject ) {
							$( '#' + escapeSelector( fieldId ) ).hide();
						};
						VisualDataFunctions.waitUntil(
							callbackCond,
							callback,
							callbackMaxAttempts,
							5
						);
					}
				}

				mw.loader.using( 'ext.VisualData.Maptiler', function () {
					var visualDataMaptiler = new VisualDataMaptiler();
					visualDataMaptiler.initialize( obj.element, obj.data );
				} );
			}
			// }, 0 );
		}

		// @IMPORTANT use "let" with timeout !!
		for ( let obj of Maps ) {
			timeOut( obj );
		}
	}

	function onSetPropertiesStack( item ) {
		showVisualEditor();
		// loadMaps();
	}

	function onChangePropertiesStack( items ) {}

	function onTabSelect( selectedSchema ) {
		SelectedSchema = selectedSchema;
		showVisualEditor();
		loadMaps();
	}

	function makeElementId( path ) {
		return `VisualDataGroupWidgetPanel-${ FormID }-${ path }`.replace(
			/ /g,
			'_'
		);
	}

	function callbackShowError( schemaName, errorMessage, errors, hiddenErrors ) {

		// remove previous error messages
		for ( var i in Fields ) {
			if ( Fields[ i ].constructor.name === 'OoUiMessageWidget' ) {
				Fields[ i ].toggle( false );
			} else {
				Fields[ i ].setErrors( [] );
			}
		}

		if ( !schemaName ) {
			return;
		}

		var escapedSchemaName = escapeJsonPtr( schemaName );

		Fields[ escapedSchemaName ].toggle( true );
		Fields[ escapedSchemaName ].setType( 'error' );

		var errorMessage = mw.msg( 'visualdata-jsmodule-forms-form-error' );
		if ( hiddenErrors && Object.keys( hiddenErrors ).length ) {
			for ( var path in hiddenErrors ) {
				errorMessage += '<br />' + hiddenErrors[ path ];
			}
		}

		Fields[ escapedSchemaName ].setLabel(
			new OO.ui.HtmlSnippet( errorMessage )
		);

		for ( var path in errors ) {
			if ( !( path in Fields ) ) {
				continue;
			}

			if ( Fields[ path ].constructor.name === 'OoUiMessageWidget' ) {
				Fields[ path ].setType( 'error' );
				Fields[ path ].setLabel( errors[ path ] );

				Fields[ path ].toggle( true );
			} else {
				Fields[ path ].setErrors( [ errors[ path ] ] );
			}
		}

		selectSchema( schemaName );

		var el = window.document.querySelector( '#' +
			jQuery.escapeSelector( makeElementId( escapedSchemaName ) ) );

		if ( el ) {
			let callbackCond = function () {
				$( el ).is( ':visible' );
			};
			let callback = function ( resolve, reject ) {
				el.scrollIntoView( {
					behavior: 'smooth'
				} );
				resolve();
			};
			let callbackMaxAttempts = function ( resolve, reject ) {
				el.scrollIntoView( {
					behavior: 'smooth'
				} );
			};

			VisualDataFunctions.waitUntil(
				callbackCond,
				callback,
				callbackMaxAttempts,
				5
			);
		}
	}

	function selectSchema( schemaName, init ) {
		if ( !schemaName ) {
			return;
		}

		var escapedSchemaName = escapeJsonPtr( schemaName );

		var el = window.document.querySelector( '#' +
			jQuery.escapeSelector( makeElementId( escapedSchemaName ) ) );

		if ( !el ) {
			return;
		}

		// indexLayout
		if ( 'setTabPanel' in SchemasLayout ) {
			SchemasLayout.setTabPanel( schemaName );

			if ( init ) {
				SchemasLayout.on( 'set', function () {
					onTabSelect( SchemasLayout.getCurrentTabPanelName() );
				} );
			}

		// booklet
		} else if ( 'setPage' in SchemasLayout ) {
			SchemasLayout.setPage( schemaName );

			if ( init ) {
				SchemasLayout.on( 'set', function () {
					onTabSelect( SchemasLayout.getCurrentPageName() );
				} );
			}
		}
	}

	function getInputWidget( config ) {
		var field = config.model.schema.wiki;

		if ( !( 'input-config' in field ) ) {
			field[ 'input-config' ] = {};
		}
		var required = 'required' in field && field.required;

		// create deep copy, otherwise changes are
		// copied to Forms[ form ].properties[ property ][ 'input-config' ]
		var inputConfig = $.extend(
			{}, // *** important !! cast to object
			VisualDataFunctions.deepCopy( field[ 'input-config' ] ),
			{ value: config.data, required: required }
		);

		if ( 'options-values-parsed' in field ) {
			inputConfig.options = field[ 'options-values-parsed' ];
		}

		var inputName =
			!( 'visibility' in field ) || field.visibility !== 'hidden' ?
				VisualDataFunctions.inputNameFromLabel(
					VisualDataFunctions.getPreferredInput( config.model.schema )
				) :
				'OO.ui.HiddenInputWidget';

		// FIXME with HiddenInputWidget, value is null (as string)
		config.model.inputName = inputName;

		if ( !( 'name' in config ) || config.name.trim() === '' ) {
			inputConfig.name = `${ FormID }-${ config.model.path }`;
		} else {
			inputConfig.name = config.name;
		}

		if ( Array.isArray( inputConfig.value ) ) {
			for ( var i in inputConfig.value ) {
				if ( inputConfig.value[ i ].trim() === '' ) {
					delete inputConfig.value[ i ];
				}
			}
		}

		// @see https://www.semantic-mediawiki.org/wiki/Help:Special_property_Allows_value
		// SemanticMediaWiki/src/DataValues/ValueValidator/AllowsListConstraintValueValidator.php
		if ( inArray( inputName, VisualDataFunctions.optionsInputs ) ) {
			if ( inputConfig.options && Object.keys( inputConfig.options ).length ) {
				inputConfig.options = VisualDataFunctions.createDropDownOptions(
					inputConfig.options
				);
			} else if ( isSMWProperty( field ) ) {
				inputConfig.options = [];
				var SMWProperty = getSMWProperty( field );
				if ( '_PVAL' in SMWProperty.properties ) {
					inputConfig.options = VisualDataFunctions.createDropDownOptions(
						SMWProperty.properties._PVAL,
						{
							key: 'value'
						}
					);
				} else {
					inputConfig.options = [];
				}
			} else {
				inputConfig.options = [];
			}
		}
		inputConfig.data = {
			// path: config.model.path,
			// schema: config.model.schema,
			model: config.model,
			performQuery
		};
		return ( InputWidgets[ inputConfig.name ] =
			VisualDataFunctions.inputInstanceFromName( inputName, inputConfig ) );
	}

	function isSMWProperty( field ) {
		return (
			'SMW-property' in field &&
			field[ 'SMW-property' ] in VisualDataSMW.getSemanticProperties()
		);
	}

	function getSMWProperty( field ) {
		if ( 'SMW-property' in field ) {
			return VisualDataSMW.getSemanticProperty( field[ 'SMW-property' ] );
		}
		return null;
	}

	function isNewSchema( schemaName ) {
		return !inArray( schemaName, RecordedSchemas );
	}

	function getCategories() {
		return Form.categories;
	}

	function getFieldAlign( schema ) {
		return 'layout-align' in Form.options ?
			Form.options[ 'layout-align' ] :
			'top';
	}

	function getHelpInline( schema ) {
		return !( 'popup-help' in Form.options ? Form.options[ 'popup-help' ] : false );
	}

	function updateFieldsVisibility( sourceModel ) {
		// *** a more complicated solution is to loop through
		// siblings using model.parent or model.parentSchema
		var pathParent = sourceModel.path.split( '/' ).slice( 0, -1 ).join( '/' );
		var pathNoIndex = sourceModel.pathNoIndex.split( '/' ).slice( -1 )[ 0 ];

		function escapeRegExp( string ) {
			return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
		}

		for ( var i in ModelFlatten ) {
			var model = ModelFlatten[ i ];

			if ( sourceModel.schemaName !== model.schemaName ) {
				continue;
			}

			if ( pathParent !== model.path.split( '/' ).slice( 0, -1 ).join( '/' ) ) {
				continue;
			}

			var field = model.schema.wiki;
			if ( !( 'showif-field' in field ) ) {
				continue;
			}

			if ( field[ 'showif-field' ] !== pathNoIndex ) {
				continue;
			}

			var value = VisualDataFunctions.castType( sourceModel.input.getValue(), sourceModel.schema.type );
			var refValue = VisualDataFunctions.castType( field[ 'showif-value' ], sourceModel.schema.type );

			var res;
			switch ( field[ 'showif-condition' ] ) {
				case '=':
					res = ( refValue === value );
					break;
				case '!=':
					res = ( refValue !== value );
					break;
				case 'starts':
					res = ( value.indexOf( refValue ) === 0 );
					break;
				case '!starts':
					res = ( value.indexOf( refValue ) !== 0 );
					break;
				case 'contains':
					res = ( value.indexOf( refValue ) !== -1 );
					break;
				case '!contains':
					res = ( value.indexOf( refValue ) === -1 );
					break;
				case 'ends':
					var regExp = new RegExp( escapeRegExp( refValue ) + '$' );
					res = regExp.test( value );
					break;
				case '!ends':
					var regExp = new RegExp( escapeRegExp( refValue ) + '$' );
					res = !regExp.test( value );
					break;
				case '!null':
					res = ( !!value );
					break;
				case 'regex':
					var regExp = new RegExp( refValue );
					res = regExp.test( value );
					break;
			}
			model.removed = !res;

			// Fields[ model.path ].toggle( res );
			var el = window.document.querySelector( '#' +
				jQuery.escapeSelector( makeElementId( model.path ) ) );

			$( el ).toggle( res );
		}
	}

	function clearDependentFields( pathNoIndex ) {
		for ( var model of ModelFlatten ) {
			var field = model.schema.wiki;
			if ( !( 'options-askquery' in field ) ) {
				continue;
			}
			var askQuery = field[ 'options-askquery' ];
			var regExp = new RegExp( '<' + pathNoIndex + '>' );
			if ( regExp.test( askQuery ) ) {
				model.input.setValue( !model.multiselect ? '' : [] );
			}
		}
	}

	function updateDependentFields( sourceModel ) {

		// @TODO complete with other optionsInputs
		var allowedInputsByContructor = [
			'OoUiDropdownInputWidget',
			'OoUiMenuTagMultiselectWidget'
		];
		for ( let model of ModelFlatten ) {
			let constructorName = model.input.constructorName || model.input.constructor.name;
			if ( !inArray( constructorName, allowedInputsByContructor ) ) {
				continue;
			}
			if ( sourceModel.schemaName !== model.schemaName ) {
				continue;
			}
			var field = model.schema.wiki;
			if ( !( 'options-askquery' in field ) ) {
				continue;
			}

			var askQuery = field[ 'options-askquery' ];
			var regExp = new RegExp( '<' + sourceModel.pathNoIndex + '>' );
			if ( regExp.test( askQuery ) ) {
				ProcessModel.getModel( 'schema', sourceModel.schemaName ).then( function ( res ) {
					for ( var i in res.flatten ) {

						if ( res.flatten[ i ].pathNoIndex === sourceModel.pathNoIndex ) {
							performQuery( model, res.flatten[ i ].value ).then( ( data_ ) => {

								// @TODO complete with other optionsInputs
								switch ( constructorName ) {
									case 'OoUiDropdownInputWidget':
										// *** @FIXME this unfortunately does not work.
										// see here https://doc.wikimedia.org/mediawiki-core/1.39.5/js/source/oojs-ui-core.html#OO-ui-DropdownInputWidget
										var value = model.input.getValue();
										if ( !( value in data_ ) ) {
											value = null;
										}

										model.input.setOptions( VisualDataFunctions.createDropDownOptions( data_ ) );
										model.input.setValue( value );
										break;
									case 'OoUiMenuTagMultiselectWidget':
										model.input.menu.clearItems();
										// Map to an array of OO.ui.MenuOptionWidgets
										var values = model.input.getValue();
										var items = [];
										for ( var j in data_ ) {
											items.push(
												new OO.ui.MenuOptionWidget( {
													data: j,
													label: data_[ j ]
												} )
											);
										}
										model.input.addOptions( items );
										model.input.setValue( values.filter( ( x ) => Object.keys( data_ ).indexOf( x ) !== -1 ) );
										break;
								}
							} );
							break;
						}
					}
				} );
			}
		}
	}

	async function performQuery( model, value ) {
		var field = model.schema.wiki;
		var askQuery = field[ 'options-askquery' ];
		var matches = [];

		var re = /<([^<>]+)>/g;
		while ( true ) {
			var match = re.exec( askQuery );
			if ( !match ) {
				break;
			}
			matches.push( match );
		}

		function doQuery() {
			var payload = {
				action: 'visualdata-askquery',
				data: JSON.stringify( {
					query: askQuery,
					properties: field[ 'askquery-printouts' ],
					schema: field[ 'askquery-schema' ],
					'options-query-formula': field[ 'options-query-formula' ],
					'options-label-formula': field[ 'options-label-formula' ]
				} )
			};

			return new Promise( ( resolve, reject ) => {
				new mw.Api()
					.postWithToken( 'csrf', payload )
					.done( function ( thisRes ) {
						if ( payload.action in thisRes ) {
							var thisData = thisRes[ payload.action ];
							thisData = JSON.parse( thisData.result );
							resolve( thisData );
						}
					} )
					.fail( function ( thisRes ) {
						// eslint-disable-next-line no-console
						console.error( 'visualdata-askquery', thisRes );
						reject( thisRes );
					} );
			} ).catch( ( err ) => {
				VisualDataFunctions.OOUIAlert( `error: ${ err }`, { size: 'medium' } );
			} );
		}

		if ( matches.length ) {
			var res = await ProcessModel.getModel( 'schema', model.schemaName );

			// @MUST MATCH classes/SubmitForm -> replaceFormula
			var parent = model.path.slice( 0, Math.max( 0, model.path.indexOf( '/' ) ) );
			for ( var match of matches ) {
				for ( var i in res.flatten ) {
					if ( match[ 1 ] === 'value' ) {
						askQuery = askQuery.replace(
							match[ 0 ],
							// value of lookupElement
							value
						);
						continue;
					}

					// match first names at the same level
					var fullPath = parent + '/' + match[ 1 ];

					if ( fullPath in res.flatten ) {
						askQuery = askQuery.replace( match[ 0 ], res.flatten[ fullPath ].value );
						continue;
					}

					// var fullPath = match[1];
					// if (fullPath.charAt(0) !== "/") {
					// 	fullPath = "/${ fullPath }";
					// }

					if ( res.flatten[ i ].pathNoIndex === fullPath ) {
						askQuery = askQuery.replace( match[ 0 ], res.flatten[ i ].value );
					}
				}
			}
		}

		return doQuery();
	}

	var FileItemWidget = function ( config ) {
		config = config || {};
		FileItemWidget.super.call( this, config );

		var self = this;
		this.parentWidget = config.parentWidget;
		this.parentWidget.setFileKey( null );

		OO.ui.mixin.GroupWidget.call(
			this,
			$.extend(
				{
					$group: this.$element
				},
				config
			)
		);

		var deleteButton = new OO.ui.ButtonWidget( {
			icon: 'trash'
			// flags: ["destructive"],
		} );

		var inputConfig = {
			required: true,
			value: config.value
		};

		var inputWidget = VisualDataFunctions.inputInstanceFromName(
			'OO.ui.TextInputWidget',
			inputConfig
		);

		this.inputWidget = inputWidget;

		var filePreview = new OO.ui.Widget( {
			classes: [ 'mw-upload-bookletLayout-filePreview' ]
		} );
		var progressBarWidget = new OO.ui.ProgressBarWidget( {
			progress: 0
		} );

		this.progressBarWidget = progressBarWidget;
		this.textInputWidget = inputWidget;

		this.messageWidget = new OO.ui.MessageWidget( {
			type: 'error',
			label: '',
			invisibleLabel: true,
			classes: [ 'visualdata-upload-messagewidget' ]
		} );

		filePreview.$element.append( progressBarWidget.$element );
		filePreview.$element.append( inputWidget.$element );
		filePreview.$element.append( this.messageWidget.$element );

		progressBarWidget.toggle( !config.loaded );
		inputWidget.toggle( config.loaded );
		this.messageWidget.toggle( false );

		this.progress = function ( progress, estimatedRemainingTime ) {
			self.progressBarWidget.setProgress( progress * 100 );
		};

		this.uploadComplete = function ( file, res ) {
			self.progressBarWidget.toggle( false );
			self.textInputWidget.toggle( true );

			self.parentWidget.setFileKey( res.upload.filekey );
		};

		this.errorMessage = function ( errorMessage ) {
			self.textInputWidget.toggle( false );
			self.progressBarWidget.toggle( false );

			self.messageWidget.$element.append( errorMessage.getMessage() );
			self.messageWidget.toggle( true );
		};

		this.fail = function ( res ) {};

		var widget = new OO.ui.ActionFieldLayout( filePreview, deleteButton, {
			label: '',
			align: 'top'
			// classes: ["inputName-" + config.inputName],
		} );

		this.$element.append( widget.$element );

		deleteButton.connect( this, {
			click: 'onDeleteButtonClick'
		} );
	};

	OO.inheritClass( FileItemWidget, OO.ui.Widget );
	OO.mixinClass( FileItemWidget, OO.ui.mixin.GroupWidget );

	FileItemWidget.prototype.onDeleteButtonClick = function () {
		this.emit( 'delete', 'file' );

		this.parentWidget.clearFileClick( this );
	};

	var FileUploadGroupWidget = function ( config ) {
		// Configuration initialization
		config = config || {};

		// Parent constructor
		FileUploadGroupWidget.super.call( this, config );

		// Mixin constructors
		OO.ui.mixin.GroupElement.call(
			this,
			$.extend(
				{
					$group: this.$element
				},
				config
			)
		);

		this.addItems( config.items || [] );
	};

	OO.inheritClass( FileUploadGroupWidget, OO.ui.Widget );
	OO.mixinClass( FileUploadGroupWidget, OO.ui.mixin.GroupElement );

	var ItemWidget = function ( config ) {
		config = config || {};
		ItemWidget.super.call( this, config );

		var schema = config.model.schema;
		var fieldAlign = getFieldAlign( schema );
		var helpInline = getHelpInline( schema );

		var inputWidget = getInputWidget( config );

		inputWidget.on( 'change', function () {
			clearDependentFields( config.model.pathNoIndex );
		} );

		inputWidget.$element.find( 'input' ).on( 'blur', function () {
			updateFieldsVisibility( config.model );
			updateDependentFields( config.model );
		} );

		config.model.input = inputWidget;

		ModelFlatten.push( config.model );

		config.model.multiselect = VisualDataFunctions.isMultiselect(
			schema.wiki[ 'preferred-input' ]
		);

		config.model.isFile = config.model.inputName === 'OO.ui.SelectFileWidget';

		if ( config.model.isFile ) {
			var fileItemWidget;

			var restoreButton = new OO.ui.ButtonWidget( {
				icon: 'restore'
			} );

			restoreButton.toggle( false );

			var fileUploadGroupWidget = new FileUploadGroupWidget( {
				items: [ inputWidget, restoreButton ]
			} );

			this.setFileKey = function ( filekey ) {
				config.model.filekey = filekey;
			};

			var loadedFiles = {};

			var self = this;

			// @FIXME
			// eslint-disable-next-line no-inner-declarations
			function createFileItemWidget( filename, loaded ) {
				// inputWidget is the SelectFileWidget
				inputWidget.toggle( false );

				// if ( loaded ) {
				config.model.previousFilename = filename;
				// }

				var thisFileItemWidget = new FileItemWidget( {
					classes: [ 'VisualDataFileItemWidget' ],
					value: filename,
					loaded: loaded,
					parentWidget: self
				} );

				loadedFiles[ filename ] = thisFileItemWidget;
				fileUploadGroupWidget.addItems( [ thisFileItemWidget ] );

				// overwrite the model, we want to
				// validate the filename
				config.model.input = thisFileItemWidget.inputWidget;

				return thisFileItemWidget;
			}

			// create fileItemWidget with existing filename
			if ( typeof config.data === 'string' && config.data.trim() !== '' ) {
				fileItemWidget = createFileItemWidget( config.data, true );
			}

			this.clearFileClick = function ( item ) {
				restoreButton.toggle( true );

				// inputWidget is the SelectFileWidget
				inputWidget.toggle( true );
				inputWidget.setValue( null );

				// TextInputWidget used for validation
				config.model.input.setValue( null );

				// this will remove fileItemWidget
				fileUploadGroupWidget.removeItems( [ item ] );
			};

			restoreButton.on( 'click', function () {
				inputWidget.toggle( false );
				restoreButton.toggle( false );
				fileUploadGroupWidget.removeItems( [ fileItemWidget ] );
				fileItemWidget = createFileItemWidget(
					// the previous content of fileItemWidget.inputWidget
					// (a TextInputWidget with filename)
					config.model.previousFilename,
					true
				);
			} );

			// @FIXME move to FileItemWidget

			this.on( 'fileUploaded', function ( file ) {
				// eslint-disable-next-line no-console
				console.log( 'event fileUploaded', file );
			} );

			this.on( 'fileUploadInit', function ( file ) {
				// eslint-disable-next-line no-console
				console.log( 'event fileUploadInit', file );
				restoreButton.toggle( false );
				fileItemWidget = createFileItemWidget( file.name, false );
			} );

			this.on(
				'fileUploadProgress',
				function ( file, progress, estimatedRemainingTime ) {
					loadedFiles[ file.name ].progress( progress, estimatedRemainingTime );
				}
			);

			this.on( 'fileUploadComplete', function ( file, res ) {
				loadedFiles[ file.name ].uploadComplete( file, res );
			} );

			this.on( 'fileUploadErrorMessage', function ( file, errorMessage ) {
				loadedFiles[ file.name ].errorMessage( errorMessage );
			} );

			this.on( 'fileUploadFail', function ( file, res ) {
				loadedFiles[ file.name ].fail( res );
			} );

			var upload = new VisualDataUpload();
			upload.initialize( inputWidget, this );
			inputWidget.on( 'change', upload.uploadFiles.bind( upload ) );
		}

		// schema.description is removed if wiki['help-message'] was ""
		var helpMessage = ( 'help-message' in schema.wiki && 'description' in schema ? schema.description : '' );

		var fieldLayout = new OO.ui.FieldLayout(
			!config.model.isFile ? inputWidget : fileUploadGroupWidget, {
				label: new OO.ui.HtmlSnippet( 'label' in schema.wiki && 'title' in schema ? schema.title : '' ),
				align: fieldAlign,
				helpInline: helpMessage ? helpInline : true,
				help: new OO.ui.HtmlSnippet( helpMessage )
				// classes: [`visualdata-input-${ config.model.path }`],
			}
		);

		Fields[ config.model.path ] = fieldLayout;

		this.$element.append( fieldLayout.$element );
	};

	OO.inheritClass( ItemWidget, OO.ui.Widget );
	OO.mixinClass( ItemWidget, OO.ui.mixin.GroupWidget );

	// @see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/c2805c7e9e83e2f3a857451d46c80231d1658a0f/demos/classes/SearchWidgetDialog.js
	function ProcessDialogSearch( config ) {
		ProcessDialogSearch.super.call( this, config );
	}
	OO.inheritClass( ProcessDialogSearch, OO.ui.ProcessDialog );
	ProcessDialogSearch.static.name = DialogSearchName;

	ProcessDialogSearch.prototype.initialize = function () {
		ProcessDialogSearch.super.prototype.initialize.apply( this, arguments );
		var self = this;
		var selectedSchemas = Form.schemas;
		this.selectedItems = [];
		function getItems( value ) {
			var values;
			switch ( self.data.toolName ) {
				case 'addremoveschemas':
					self.selectedItems = selectedSchemas;
					values = Object.keys( Schemas );
					break;
			}

			if ( value ) {
				var valueLowerCase = value.toLowerCase();
				values = values.filter(
					( x ) => x.toLowerCase().indexOf( valueLowerCase ) !== -1
				);
			}

			return values.map( ( x ) => {
				var menuOptionWidget = new OO.ui.MenuOptionWidget( {
					data: x,
					label: x,
					selected: inArray( x, self.selectedItems )
				} );
				return menuOptionWidget;
			} );
		}

		var searchWidget = new OO.ui.SearchWidget( {
			// id: "visualdata-import-search-widget",
		} );

		searchWidget.results.addItems( getItems() );

		// searchWidget.getResults() is a SelectWidget
		// https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.SelectWidget
		var searchWidgetResults = searchWidget.getResults();
		searchWidgetResults.multiselect = true;

		searchWidgetResults.on( 'press', function ( value ) {
			if ( value === null ) {
				return;
			}
			if ( inArray( value.data, self.selectedItems ) ) {
				self.selectedItems.splice( self.selectedItems.indexOf( value.data ), 1 );
			} else {
				self.selectedItems.push( value.data );
			}
		} );
		searchWidget.onQueryChange = function ( value ) {
			searchWidget.results.clearItems();
			searchWidget.results.addItems( getItems( value ) );
		};

		this.$body.append( [ searchWidget.$element ] );
	};

	ProcessDialogSearch.prototype.getBodyHeight = function () {
		return 300;
	};

	ProcessDialogSearch.static.actions = [
		{
			action: 'save',
			// modes: "edit",
			label: mw.msg( 'visualdata-jsmodule-forms-searchdialog-save' ),
			flags: [ 'primary', 'progressive' ]
		},
		{
			// modes: "edit",
			label: mw.msg( 'visualdata-jsmodule-forms-cancel' ),
			flags: [ 'safe', 'close' ]
		}
	];
	ProcessDialogSearch.prototype.getActionProcess = function ( action ) {
		var dialog = this;

		if ( action === 'save' ) {
			var values = processDialogSearch.selectedItems;
			// ProcessModel.getModel("fetch").then(function (res) {
			// Form.jsonData.schemas = res;

			switch ( dialog.data.toolName ) {
				case 'addremoveschemas':
					for ( var i in ModelSchemas ) {
						if ( !inArray( i, values ) ) {
							// delete Form.jsonData.schemas[ i ];
							delete ModelSchemas[ i ];
							delete Fields[ i ];
						}
					}

					var missingSchemas = [];
					for ( var i of values ) {
						if ( !( i in Schemas ) || !Object.keys( Schemas[ i ] ).length ) {
							missingSchemas.push( i );
						}
					}

					// select first schema of new selection
					for ( var i of values ) {
						if ( !( i in ModelSchemas ) ) {
							SelectedSchema = i;
							break;
						}
					}

					if ( missingSchemas.length ) {
						VisualData.loadSchemas( missingSchemas );
					} else {
						updatePanels();
					}

					break;
			}
			// });
		}

		return new OO.ui.Process( function () {
			dialog.close( { action: action } );
		} );

		// return ProcessDialog.super.prototype.getActionProcess.call( this, action );
	};
	ProcessDialogSearch.prototype.getTeardownProcess = function ( data ) {
		return ProcessDialogSearch.super.prototype.getTeardownProcess
			.call( this, data )
			.first( function () {
				WindowManager.removeActiveWindow();
			}, this );
	};

	function openSearchDialog( toolName ) {
		processDialogSearch = new ProcessDialogSearch( {
			size: 'medium',
			// classes: ["visualdata-search-dialog"],
			data: { toolName: toolName }
		} );

		WindowManager.newWindow( processDialogSearch, {
			title: mw.msg(
				'visualdata-jsmodule-forms-dialogsearch-selectschemas'
			)
		} );
	}

	// @see https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.Toolbar
	// @see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/c2805c7e9e83e2f3a857451d46c80231d1658a0f/demos/pages/toolbars.js
	function createToolbar( /* disabled */ ) {
		var toolFactory = new OO.ui.ToolFactory();
		var toolGroupFactory = new OO.ui.ToolGroupFactory();

		var toolbar = new OO.ui.Toolbar( toolFactory, toolGroupFactory, {
			actions: true
		} );

		var onSelect = function ( self ) {
			var self = arguments.length ? self : this;
			var toolName = self.getName();

			switch ( toolName ) {
				case 'addremoveschemas':
					openSearchDialog( toolName );
					break;
				// case "createschema":
				// 	VisualDataSchemas.openDialog(null, false);
				// 	break;
			}

			self.setActive( false );
		};

		var loadDataBeforeSelect = function () {
			var dataToLoad = VisualData.matchLoadedData( Config, [
				'schemas'
			] );

			if ( !dataToLoad.length ) {
				return onSelect( this );
			}

			this.setDisabled( true );
			this.pushPending();

			VisualData.loadData( Config, dataToLoad )
				.then( ( res ) => {
					if ( 'schemas' in res ) {
						Schemas = res.schemas;
					}
					this.setDisabled( false );
					this.popPending();
					onSelect( this );
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( 'loadData error', error );
					this.popPending();
					this.setDisabled( false );
					this.setActive( false );

					// eslint-disable-next-line mediawiki/msg-doc
					VisualDataFunctions.OOUIAlert( new OO.ui.HtmlSnippet( mw.msg( error ) ), {
						size: 'medium'
					} );
				} );
		};

		var toolGroup = [];

		if ( Config.context !== 'parserfunction' ) {
			toolGroup.push( {
				name: 'addremoveschemas',
				icon: 'add',
				title: mw.msg(
					'visualdata-jsmodule-forms-addremoveschemas'
				),
				onSelect: onSelect
			} );
		}

		VisualDataFunctions.createToolGroup( toolFactory, 'group', toolGroup );

		toolbar.setup( [
			{
				name: 'my-group',
				// type: "bar",
				// label: "Create property",
				include: [ { group: 'group' } ]
			}
		] );

		return toolbar;
	}

	function createActionToolbar( /* disabled */ ) {
		// see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/refs/tags/v0.40.4/demos/pages/toolbars.js
		var toolFactory = new OO.ui.ToolFactory();
		var toolGroupFactory = new OO.ui.ToolGroupFactory();

		var toolbar = new OO.ui.Toolbar( toolFactory, toolGroupFactory, {
			actions: false
		} );

		var onSelect = function ( self ) {
			var self = arguments.length ? self : this;
			var selected = self.getName();

			var panels = OuterStack.getItems();
			for ( var panel of panels ) {
				if ( panel.getData().name === selected ) {
					break;
				}
			}

			OuterStack.setItem( panel );

			// *** this prevents inconsistencies of the datatable layout
			switch ( selected ) {
				case 'manage-schemas':
					VisualDataSchemas.initialize();
					break;
				// case "manage-forms":
				// 		VisualDataForms.initialize();
				// 		break;
				// 	case "manage-semantic-properties":
				// 		VisualDataSMW.initialize();
				// 		break;
			}

			self.setActive( false );
		};

		var loadDataBeforeSelect = function () {
			var dataToLoad = VisualData.matchLoadedData( Config, [
				// "forms",
				'schemas'
				// "semantic-properties",
				// "imported-vocabularies",
				// "type-labels",
				// "property-labels",
			] );

			if ( !dataToLoad.length ) {
				return onSelect( this );
			}

			// this.setDisabled(true);
			// this.pushPending();

			ActionWidget = new OO.ui.ActionWidget();
			ToolbarMain.$bar.wrapInner( '<div class="wrapper"></div>' );
			ActionWidget.setPendingElement( ToolbarMain.$bar.find( '.wrapper' ) );
			ActionWidget.pushPending();

			$( ToolbarMain.$bar ).find( '.wrapper' ).css( 'pointer-events', 'none' );

			VisualData.loadData( Config, dataToLoad )
				.then( ( res ) => {
					// this.setDisabled(false);
					// this.popPending();
					ActionWidget.popPending();
					$( ToolbarMain.$bar ).find( '.wrapper' ).css( 'pointer-events', 'auto' );

					// VisualDataSMW.initialize(
					// 		Self,
					// 		res["imported-vocabularies"],
					// 		res["type-labels"],
					// 		res["property-labels"]
					// );

					// VisualDataForms.initialize(Self, Forms);

					onSelect( this );
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( 'loadData error', error );
					ActionWidget.popPending();
					$( ToolbarMain.$bar ).find( '.wrapper' ).css( 'pointer-events', 'auto' );
					this.setActive( false );

					// eslint-disable-next-line mediawiki/msg-doc
					VisualDataFunctions.OOUIAlert( new OO.ui.HtmlSnippet( mw.msg( error ) ), {
						size: 'medium'
					} );
				} );
		};

		var toolGroup = [
			{
				name: 'visualdata',
				icon: null,
				title: mw.msg( 'visualdata-jsmodule-forms-edit-data' ),
				onSelect: onSelect
			},
			{
				name: 'manage-schemas',
				icon: null,
				title: mw.msg( 'visualdata-jsmodule-forms-manage-schemas' ),
				onSelect: loadDataBeforeSelect
				// config: {
				// 	data: { disabled: disabled },
				// },
			}
			// {
			// 	name: 'manage-forms',
			// 	icon: null,
			// 	title: mw.msg( 'visualdata-jsmodule-forms-manage-forms' ),
			// 	onSelect: loadDataBeforeSelect
			// 	// config: {
			// 	// 	data: { disabled: disabled },
			// 	// },
			// }
		];

		toolbar.setup( [
			// see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/c2805c7e9e83e2f3a857451d46c80231d1658a0f/demos/pages/toolbars.js
			{
				name: 'editorSwitch',
				align: 'after',
				type: 'list',
				label: 'Switch editor',
				invisibleLabel: true,
				icon: 'menu',
				include: [ { group: 'selectSwitch' } ]
			}
		] );

		// @see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/c2805c7e9e83e2f3a857451d46c80231d1658a0f/demos/pages/toolbars.js
		// VisualDataFunctions.createDisabledToolGroup(
		// 	toolGroupFactory,
		// 	OO.ui.ListToolGroup,
		// 	"editorSwitch",
		// );

		VisualDataFunctions.createToolGroup(
			toolFactory,
			'selectSwitch',
			toolGroup
		);

		return toolbar;
	}

	var GroupWidget = function ( config, data ) {
		config = config || {};
		GroupWidget.super.call( this, config );

		OO.ui.mixin.GroupWidget.call(
			this,
			$.extend( { $group: this.$element }, config )
		);
		// OO.EventEmitter.call( this );

		this.data = data;

		function showBorder() {
			if (
				data.root ||
				data.schema.wiki.type === 'content-block' ||
				data.schema.wiki.type === 'property'
			) {
				return false;
			}

			if (
				data.schema.type === 'array' &&
				VisualDataFunctions.getNestedProp( [ 'items', 'wiki', 'preferred-input' ], data.schema ) &&
				data.schema.items.type !== 'object' &&
				VisualDataFunctions.isMultiselect(
					data.schema.items.wiki[ 'preferred-input' ]
				)
			) {
				return false;
			}
			return true;
		}
		var showBorderValue = showBorder();

		// eslint-disable-next-line mediawiki/class-doc
		var layout = new OO.ui.PanelLayout( {
			expanded: false,
			padded: showBorderValue,
			framed: showBorderValue,
			classes: [
				'VisualDataGroupWidgetPanel' + ( !showBorderValue ? '-border' : '' )
			],
			id: makeElementId( data.path )
		} );

		this.layout = layout;

		if ( data.root ) {
			var $containerRight = $( '<div class="visualdata-form-container-right">' );
			layout.$element.append( $containerRight );

			if ( Config.context === 'EditData' ) {
				var deleteButton = new OO.ui.ButtonWidget( {
					icon: 'trash',
					framed: false,
					label: mw.msg( 'visualdata-jsmodule-forms-delete-schema' ),
					invisibleLabel: true,
					flags: [ 'destructive' ]
				} );

				deleteButton.on( 'click', function () {
					Form.schemas.splice( Form.schemas.indexOf( data.schema.wiki.name ), 1 );
					// delete Form.jsonData.schemas[ data.schema.wiki.name ];
					delete ModelSchemas[ data.schema.wiki.name ];
					delete Fields[ data.schema.wiki.name ];
					updatePanels();
				} );

				$containerRight.append( deleteButton.$element );
			}

			if ( Config.canmanageschemas ) {
				var editButton = new OO.ui.ButtonWidget( {
					// 'settings'
					icon: 'edit',
					framed: false,
					label: mw.msg( 'visualdata-jsmodule-forms-edit-schema' ),
					invisibleLabel: true
					// classes: ["VisualDataOptionsListDeleteButton"],
				} );

				editButton.on( 'click', function () {
					VisualDataSchemas.openSchemaDialog(
						[ data.schema.wiki.name ],
						'properties'
					);
				} );

				$containerRight.append( editButton.$element );
			}
		}

		var messageWidget = new OO.ui.MessageWidget( {
			classes: [ 'VisualDataGroupWidgetMessageWidget' ]
		} );

		// @TODO toggle parent as well if all children
		// aren't visible
		this.toggle(
			!VisualDataFunctions.getNestedProp(
				[ 'schema', 'options', 'hidden' ],
				data
			)
		);

		messageWidget.toggle( false );

		Fields[ data.path ] = messageWidget;

		layout.$element.append( messageWidget.$element );

		switch ( data.schema.wiki.layout ) {
			case 'horizontal':
				this.layoutHorizontal = new OO.ui.HorizontalLayout();

				layout.$element.append(
					$(
						'<div class="visualdata-form-table-multiple-fields" style="display: table">'
					).append( [
						$( '<div style="display: table-cell;vertical-align:middle">' ).append(
							this.layoutHorizontal.$element
						),
						$(
							'<div class="visualdata-horizontal-section-remove-row" style="display: table-cell">'
						)
					] )
				);
				break;

			default:
				// title and description are mapped to label and
				// help-message in the property field, and
				// schema.wiki.title and schema.wiki.description
				// contain the wikitext, not the parsed output

				this.fieldset = new OO.ui.FieldsetLayout( {
					label: new OO.ui.HtmlSnippet( 'title' in data.schema.wiki && 'title' in data.schema ? data.schema.title : '' )
				} );

				if ( 'description' in data.schema.wiki && 'description' in data.schema ) {
					this.fieldset.addItems( [
						new OO.ui.Element( {
							content: [
								new OO.ui.HtmlSnippet( data.schema.description )
							]
						} )
					] );
				}

				if ( data.schema.wiki.layout === 'table' ) {
					layout.$element.append(
						$(
							'<div class="visualdata-form-table-multiple-fields" style="display: table">'
						).append( [
							$( '<div style="display: table-cell">' ).append(
								this.fieldset.$element
							),
							$(
								'<div class="visualdata-horizontal-section-remove-row" style="display: table-cell">'
							)
						] )
					);
				} else {
					layout.$element.append( this.fieldset.$element );
				}

				if ( data.schema.wiki.type === 'geolocation' && data.schema.wiki.map === true ) {
					if ( !Maps.length ) {
						( new VisualDataMaptiler() ).load();
					}
					Maps.push( { data, element: layout.$element } );
				}

				this.connect( this, {
					formLoaded: 'formLoaded'
				} );
		}

		/*
		// @TODO implement button switch for oneOf, anyOf
		this.buttonSelectWidget = new OO.ui.ButtonSelectWidget();

		var self = this;
		this.buttonSelectWidget.on("choose", function (item, seleted) {
			self.booklet.setPage(item.data);
		});

		layout.$element.append(this.buttonSelectWidget.$element);

		// var directives = [ 'anyOf', 'oneOf', 'allOf' ];

		// for ( var directive of directives ) {
		// 	this['fieldset-' + directive] = new OO.ui.FieldsetLayout({
		// 		// label: data.wiki.title,
		// 	});
		// 	layout.$element.append(this['fieldset-' + directive].$element);
		// }

		this.booklet = new OO.ui.BookletLayout({
			outlined: false,
			expanded: true,
			padded: false,
			classes: ["VisualDataGroupWidgetBooklet"],
		});

		layout.$element.append(this.booklet.$element);

		*/

		this.$element.append( layout.$element );
	};

	OO.inheritClass( GroupWidget, OO.ui.Widget );
	OO.mixinClass( GroupWidget, OO.ui.mixin.GroupWidget );
	// OO.mixinClass( GroupWidget, OO.EventEmitter );

	GroupWidget.prototype.formLoaded = function () {
	//	if ( this.data.root === true ) {
		setTimeout( function () {
			VisualDataFunctions.removeNbspFromLayoutHeader( 'form' );
		}, 30 );

		setTimeout( function () {
			VisualDataFunctions.removeNbspFromLayoutHeader(
				'#visualdataform-wrapper-dialog-' + FormID
			);
		}, 30 );

		// *** we use mutationChange instead
		// for ( var model of ModelFlatten ) {
		//	updateFieldsVisibility( model );
		// }

		loadMaps();

		for ( var model of ModelFlatten ) {
			updateDependentFields( model );
		}
		// }
	};

	GroupWidget.prototype.addItems = function ( items ) {
		if ( this.data.schema.wiki.layout === 'horizontal' ) {
			this.layoutHorizontal.addItems( items );
		} else {
			this.fieldset.addItems( items );
		}
	};

	GroupWidget.prototype.addCombinedItem = function ( item, title, directive ) {
		// this['fieldset-' + directive].addItems(items);

		var items = [
			new OO.ui.ButtonOptionWidget( {
				data: title,
				label: title
			} )
		];
		this.buttonSelectWidget.addItems( items );

		//	this['fieldset-' + directive]..addItems(items);

		if ( this.buttonSelectWidget.items.length === 1 ) {
			this.buttonSelectWidget.selectItem( items[ 0 ] );
		}

		var ThisPageLayout = function ( name, config ) {
			ThisPageLayout.super.call( this, name, config );
			this.$element.append( item.$element );
		};
		OO.inheritClass( ThisPageLayout, OO.ui.PageLayout );

		var page = new ThisPageLayout( title );

		this.booklet.addPages( [ page ] );
	};

	function PanelLayout( config ) {
		PanelLayout.super.call( this, config );

		var data = this.data;
		var content;

		if ( !( 'layout' in Form.options ) ) {
			Form.options.layout = 'tabs';
		}

		// @TODO implement booklet also outside dialog
		if ( Form.options.layout === 'booklet' && Form.options.view !== 'popup' && Form.options.view !== 'button' ) {
			Form.options.layout = 'tabs';
		}

		PendingRecursive = 0;
		QueuedWidgets = [];
		Maps = [];
		function getWidgets() {
			var ret = {};

			for ( var schemaName_ of Form.schemas ) {

				var schema = Schemas[ schemaName_ ];
				var previousSchema =
					schemaName_ in PreviousSchemas ?
						PreviousSchemas[ schemaName_ ] :
						{};

				if ( !( schemaName_ in Form.jsonData.schemas ) ) {
					Form.jsonData.schemas[ schemaName_ ] = {};
				}

				var path = `${ escapeJsonPtr( schemaName_ ) }`;
				var pathNoIndex = '';
				var model = ( ModelSchemas[ schemaName_ ] = {
					parent: ModelSchemas,
					childIndex: schemaName_,
					parentSchema: null
				} );
				var widget = new GroupWidget(
					{},
					{ root: true, schema, path, model }
				);

				processSchema(
					widget,
					schema,
					previousSchema,
					schemaName_,
					model,
					Form.jsonData.schemas[ schemaName_ ],
					path,
					pathNoIndex,
					false
				);

				ret[ schemaName_ ] = widget;
			}

			return ret;
		}

		function getFreeTextInput( wikitext, thisConfig ) {
			var thisInputWidget;

			thisConfig = $.extend(
				{
					name: `${ FormID }-model-freetext`,
					id: `${ FormID }-model-freetext`
				},
				thisConfig
			);

			if ( !wikitext || !Config.VEForAll ) {
				thisInputWidget = new OO.ui.MultilineTextInputWidget(
					$.extend(
						{
							autosize: true,
							rows: 6
						},
						thisConfig
					)
				);
			} else {
				thisInputWidget = new VisualDataVisualEditor( thisConfig );
			}
			Model.freetext = thisInputWidget;
			InputWidgets[ thisConfig.name ] = thisInputWidget;
			return thisInputWidget;
		}

		switch ( data.name ) {
			case 'schemas':
				if ( !( 'schemas' in Form.jsonData ) ) {
					Form.jsonData.schemas = {};
				}

				for ( var thisSchemaName of Form.schemas ) {
					if ( !( thisSchemaName in Schemas ) ) {
						// eslint-disable-next-line no-console
						console.error( "required schema doesn't exist", thisSchemaName );
					}
				}

				Form.schemas = Form.schemas.filter( ( x ) => x in Schemas );

				if ( !SelectedSchema || Form.schemas.indexOf( SelectedSchema ) === -1 ) {
					SelectedSchema = ( Form.schemas.length ? Form.schemas[ 0 ] : null );
				}

				var layout = Form.options.layout;
				var widgets = getWidgets();

				if ( !SelectedSchema ) {
					this.isEmpty = true;
					return false;
				}

				var ThisPageLayout = function ( name, thisConfig ) {
					ThisPageLayout.super.call( this, name, thisConfig );
				};

				OO.inheritClass( ThisPageLayout, OO.ui.PageLayout );

				ThisPageLayout.prototype.setupOutlineItem = function () {
					this.outlineItem.setLabel( this.name );
				};

				var ThisTabPanelLayout = function ( name, thisConfig ) {
					this.name = name;
					ThisTabPanelLayout.super.call( this, name, thisConfig );
				};

				OO.inheritClass( ThisTabPanelLayout, OO.ui.TabPanelLayout );
				ThisTabPanelLayout.prototype.setupTabItem = function () {
					this.tabItem.setLabel( this.name );

					this.deleteButton = new OO.ui.ButtonWidget( {
						icon: 'close',
						framed: false,
						label: mw.msg( 'visualdata-jsmodule-forms-delete-schema' ),
						invisibleLabel: true,
						classes: [ 'VisualDataTabPanelLayoutTabItemDeleteButton' ]
					} );

					this.deleteButton.on( 'click', function () {
						Form.schemas.splice( Form.schemas.indexOf( this.name ), 1 );
						// delete Form.jsonData.schemas[ data.schema.wiki.name ];
						delete ModelSchemas[ this.name ];
						delete Fields[ this.name ];
						updatePanels();
					} );

					this.deleteButton.toggle( this.name === SelectedSchema );
					// @TODO
					// this.tabItem.$label.append( this.deleteButton.$element );
				};

				ThisTabPanelLayout.prototype.toggleCloseButton = function () {
				};

				switch ( layout ) {
					case 'single':
						content = widgets[ SelectedSchema ];
						this.$element.addClass( 'PanelPropertiesStackPanelSingle' );

						break;
					case 'booklet':
						var booklet = new OO.ui.BookletLayout( {
							outlined: true,
							expanded: true,
							padded: false
						} );

						// booklet.on( 'set', function () {
						// 	onTabSelect( booklet.getCurrentPageName() );
						// } );

						SchemasLayout = booklet;

						var items = [];

						for ( var schemaName in widgets ) {
							var tabPanel = new ThisPageLayout( schemaName );
							tabPanel.$element.append( widgets[ schemaName ].$element );
							items.push( tabPanel );
						}

						booklet.addPages( items );
						content = booklet;

						// booklet.setPage( SelectedSchema );

						this.$element.addClass( 'PanelPropertiesStackPanelBooklet' );

						break;
					case 'tabs':
					default:
						var indexLayout = new OO.ui.IndexLayout( {
							framed: true,
							showMenu: false,
							expanded: true,
							padded: false,
							autoFocus: false
						} );

						SchemasLayout = indexLayout;

						// indexLayout.on( 'set', function () {
						// 	onTabSelect( indexLayout.getCurrentTabPanelName() );
						// } );

						var items = [];
						for ( var schemaName in widgets ) {
							var tabPanel = new ThisTabPanelLayout( schemaName );
							tabPanel.$element.append( widgets[ schemaName ].$element );
							items.push( tabPanel );
						}

						indexLayout.addTabPanels( items );
						// indexLayout.setTabPanel( SelectedSchema );
						content = indexLayout;

						this.$element.addClass( 'PanelPropertiesStackPanelTabs' );

						break;
				}
				break;

			case 'article':
				var items = [];
				var userDefinedInput;
				var userDefinedField;
				var freeTextField;
				var categoriesField;
				var contentModelField;

				if ( data.userDefined ) {
					var inputName = 'mw.widgets.TitleInputWidget';

					userDefinedInput = new mw.widgets.TitleInputWidget( {
						name: `${ FormID }-model-target-title`,
						value: !( 'userDefined' in Form ) ? '' : Form.userDefined,
						// @FIXME if the stack panel is hidden
						// this will create a browser error
						required: true
					} );

					Model[ 'target-title' ] = userDefinedInput;

					userDefinedField = new OO.ui.FieldLayout( userDefinedInput, {
						label: mw.msg( 'visualdata-jsmodule-forms-pagename' ),
						align: data.fieldAlign
						// classes: ["ItemWidget", "inputName-" + inputName],
					} );
					items.push( userDefinedField );
				}

				if ( data.editTargetSlot ) {
					var targetSlotInput = new OO.ui.DropdownInputWidget( {
						name: `${ FormID }-model-target-slot`,
						options: VisualDataFunctions.createDropDownOptions( {
							jsondata: mw.msg( 'visualdata-jsmodule-forms-target-slot-option-jsondata' ),
							main: mw.msg( 'visualdata-jsmodule-forms-target-slot-option-main' )
						} ),
						value: Form.options[ 'target-slot' ]
					} );

					Model[ 'target-slot' ] = targetSlotInput;

					targetSlotInput.on( 'change', function ( value ) {
						if ( freeTextField ) {
							freeTextField.toggle( value !== 'main' );
						}
						if ( contentModelField ) {
							contentModelField.toggle( value !== 'main' );
						}
					} );

					TargetSlotField = new OO.ui.FieldLayout( targetSlotInput, {
						label: mw.msg( 'visualdata-jsmodule-forms-target-slot' ),
						help: mw.msg( 'visualdata-jsmodule-forms-target-slot-help' ),
						helpInline: true,
						align: data.fieldAlign
					} );

					// TargetSlotField.toggle( false );

					items.push( TargetSlotField );
				}

				if ( data.editFreeText ) {
					var inputWidget = getFreeTextInput( Config.contentModel === 'wikitext', {
						value: Form.freetext,
						contentModel: Config.contentModel
					} );

					freeTextField = new OO.ui.FieldLayout( inputWidget, {
						label: mw.msg( 'visualdata-jsmodule-forms-freetext' ),
						align: data.fieldAlign
					} );

					freeTextField.toggle( Form.options[ 'target-slot' ] !== 'main' );

					items.push( freeTextField );
				}

				if ( data.editCategories ) {
					var categories = data.categories;

					var categoriesInput = new mw.widgets.CategoryMultiselectWidget( {
						name: `${ FormID }-model-categories`
						// value: categories,
					} );

					Model.categories = categoriesInput;

					// ***prevents error "Cannot read properties of undefined (reading 'apiUrl')"
					for ( var category of categories ) {
						categoriesInput.addTag( category );
					}

					categoriesField = new OO.ui.FieldLayout( categoriesInput, {
						label: mw.msg( 'visualdata-jsmodule-forms-categories' ),
						align: data.fieldAlign,
						classes: [ 'VisualDataItemWidget' ]
					} );

					items.push( categoriesField );
				}

				if ( data.editContentModel ) {
					var contentModelInput = new OO.ui.DropdownInputWidget( {
						name: `${ FormID }-model-content-model`,
						options: VisualDataFunctions.createDropDownOptions(
							Config.contentModels
						),
						value: Config.contentModel
					} );

					contentModelInput.on( 'change', async function ( value ) {
						if ( !( 'freetext' in Model ) ) {
							return;
						}
						var thisInputWidget;
						var freetextValue = Model.freetext.getValue();

						if ( VisualDataFunctions.isPromise( freetextValue ) ) {
							freetextValue = await freetextValue;
						}

						// @TODO convert from/to html and wikitext
						// value === "html" ||
						if ( value === 'wikitext' ) {
							thisInputWidget = getFreeTextInput( true, {
								contentModel: value,
								value: freetextValue
							} );
							// // @TODO use TinyMCE for html
						} else {
							thisInputWidget = getFreeTextInput( false, {
								value: freetextValue
							} );
						}
						$( `#${ FormID }-model-freetext` ).replaceWith( thisInputWidget.$element );
					} );

					Model[ 'content-model' ] = contentModelInput;

					contentModelField = new OO.ui.FieldLayout( contentModelInput, {
						label: mw.msg( 'visualdata-jsmodule-forms-content-models' ),
						align: data.fieldAlign,
						classes: [ 'VisualDataItemWidget' ]
					} );

					contentModelField.toggle( Form.options[ 'target-slot' ] !== 'main' );

					items.push( contentModelField );
				}

				if ( !items.length ) {
					this.isEmpty = true;
					return false;
				}

				this.$element.addClass( 'PanelPropertiesStackPanelFieldset' );

				content = new OO.ui.FieldsetLayout( {
					label: '',
					items: items
				} );
		}

		this.isEmpty = false;
		this.$element.append( content.$element );
	}

	OO.inheritClass( PanelLayout, OO.ui.PanelLayout );

	var OptionsList = function ListWidget( config, schema, model ) {
		config = config || {};

		// Call parent constructor
		OptionsList.super.call( this, config );

		OO.ui.mixin.GroupWidget.call(
			this,
			$.extend(
				{
					$group: this.$element
				},
				config
			)
		);

		this.schema = schema;
		this.model = model;

		this.aggregate( {
			delete: 'itemDelete'
		} );

		this.connect( this, {
			itemDelete: 'onItemDelete'
		} );

		this.connect( this, {
			add: 'onAddItem'
		} );
	};

	OO.inheritClass( OptionsList, OO.ui.Widget );
	OO.mixinClass( OptionsList, OO.ui.mixin.GroupWidget );

	OptionsList.prototype.onAddItem = function () {};

	OptionsList.prototype.onItemDelete = function () {};

	// OptionsList.prototype.addItems = function (items) {
	// 	for ( var i in items ) {
	// 		OO.ui.mixin.GroupWidget.prototype.addItem.call(this, items[i], i);
	// 	}
	// }

	OptionsList.prototype.addItem = function ( item, i ) {
		var self = this;
		item.data.index = i;

		function recDeleteValue( model ) {
			switch ( model.schema.type ) {
				case 'object':
					if ( 'properties' in model ) {
						for ( var ii in model.properties ) {
							recDeleteValue( model.properties[ ii ] );
						}
					}
					break;
				case 'array':
					// @TODO implement tuple
					if ( VisualDataFunctions.isObject( schema.items ) ) {
						recDeleteValue( model.items );
					}
					break;
				default:
					if ( 'input' in model ) {
						model.input.setValue( !model.multiselect ? '' : [] );
					}
			}
		}

		var deleteButton = new OO.ui.ButtonWidget( {
			icon: 'close'
			// flags: ["destructive"],
			// classes: ["VisualDataOptionsListDeleteButton"],
		} );
		deleteButton.on( 'click', function () {
			if (
				!( 'minItems' in self.schema ) ||
				self.items.length > self.schema.minItems
			) {
				// *** rather than removing the item
				// from the model, we mark it as removed
				// this ensures consistency of the data
				// structure, the items marked as removed
				// will be removed from submitted data.
				// Both the 2 alternate methods aren't
				// optimal: updatePanels() is too expensive
				// and renaming all the data structure
				// is too tricky and leads to errors
				self.removeItems( [ item ] );
				self.model[ item.data.index ].removed = true;
			} else {
				recDeleteValue( self.model[ item.data.index ] );
			}
		} );

		if (
			item.data.schema.wiki.layout === 'horizontal' ||
			item.data.schema.wiki.layout === 'table'
		) {
			$( item.$element )
				.find( '.visualdata-horizontal-section-remove-row' )
				.append( deleteButton.$element );
		} else {
			item.$element.prepend(
				$( '<div style="text-align:right">' ).append( deleteButton.$element )
			);
		}

		OO.ui.mixin.GroupWidget.prototype.addItems.call( this, [ item ] );

		this.emit( 'add', item );

		return this;
	};

	OptionsList.prototype.removeItems = function ( items ) {
		OO.ui.mixin.GroupWidget.prototype.removeItems.call( this, items );
		this.emit( 'remove', items );
		return this;
	};

	OptionsList.prototype.clearItems = function () {
		var items = this.items.slice();
		OO.ui.mixin.GroupWidget.prototype.clearItems.call( this );
		this.emit( 'remove', items );
		return this;
	};

	function schemaHasData( schemaName ) {
		return VisualDataFunctions.getNestedProp( [ 'schemas', schemaName ], StoredJsonData ) &&
			Object.keys( StoredJsonData.schemas[ schemaName ] ).length;
	}

	// @FIXME store for each separate schema
	function applyUntransformed( data, i, path ) {
		if (
			!( 'schemas-data' in Form.jsonData ) ||
			!( 'untransformed' in Form.jsonData[ 'schemas-data' ] ) ||
			!( path in Form.jsonData[ 'schemas-data' ].untransformed )
		) {
			return;
		}

		// *** this ensures subsequent edits are maintained
		data[ i ] = Form.jsonData[ 'schemas-data' ].untransformed[ path ];
		delete Form.jsonData[ 'schemas-data' ].untransformed[ path ];
	}

	var OptionsListContainer = function OptionsListContainer(
		config,
		schema,
		item,
		previousItem,
		schemaName,
		model,
		data,
		path,
		pathNoIndex,
		newItem
	) {
		config = config || {};

		// Call parent constructor
		OptionsListContainer.super.call( this, config );

		// display multiselect
		if (
			item.type !== 'object' &&
			'preferred-input' in item.wiki &&
			VisualDataFunctions.isMultiselect( item.wiki[ 'preferred-input' ] )
		) {
			var widget_ = new GroupWidget( {}, { schema: item, path, model } );
			processSchema(
				widget_,
				item,
				previousItem,
				schemaName,
				model,
				data,
				path,
				pathNoIndex,
				newItem
			);
			this.$element.append( widget_.$element );
			return;
		}

		this.optionsList = new OptionsList( {}, schema, model );

		var minItems = 'minItems' in schema ? schema.minItems : 0;
		var data;
		if (
			Array.isArray( item.default ) &&
			( !Array.isArray( data ) || !data.length ) &&
			( isNewSchema( schemaName ) || Form.emptyData )
		) {
			data = item.default;
		}

		if ( Array.isArray( data ) && minItems < data.length ) {
			minItems = data.length;
		}

		// data is not an object if the type of schema
		// changed from non object to object, e.g.
		// an array of text fields vs an array
		// of subitems, and the name/key was the same
		if ( data === null || typeof data !== 'object' ) {
			data = {};
		}

		var i = 0;
		while ( this.optionsList.items.length < minItems ) {
			var newItem = false;
			if ( !( i in data ) ) {
				data[ i ] = {};
				newItem = true;
			}
			var path_ = `${ path }/${ i }`;
			applyUntransformed( data, i, path );
			var thisModel = ( model[ i ] = {
				parent: model,
				childIndex: i,
				parentSchema: schema
			} );
			var widget_ = new GroupWidget( {}, { schema: item, path: path_, model: thisModel } );
			processSchema(
				widget_,
				item,
				previousItem,
				schemaName,
				thisModel,
				data[ i ],
				path_,
				pathNoIndex,
				newItem
			);
			this.optionsList.addItem( widget_, i );
			i++;
		}

		var self = this;

		var addOption = new OO.ui.ButtonWidget( {
			icon: 'add'
		} );

		addOption.on( 'click', function () {
			if (
				!( 'maxItems' in schema ) ||
				self.optionsList.items.length < schema.maxItems
			) {
				var ii = self.optionsList.items.length ?
					self.optionsList.items[ self.optionsList.items.length - 1 ].data
						.index + 1 :
					0;
				var modelAddOption = ( model[ ii ] = {
					parent: model,
					childIndex: ii,
					parentSchema: schema
				} );
				var widgetAddOption = new GroupWidget( {}, { schema: item, path, model: modelAddOption } );

				var thisPath_ = `${ path }/${ ii }`;
				processSchema(
					widgetAddOption,
					item,
					previousItem,
					schemaName,
					modelAddOption,
					( data[ ii ] = {} ),
					thisPath_,
					pathNoIndex,
					true
				);
				self.optionsList.addItem( widgetAddOption, ii );
			}
		} );

		this.$element.append( this.optionsList.$element );
		this.$element.append( addOption.$element );
	};

	OO.inheritClass( OptionsListContainer, OO.ui.Widget );
	// OO.mixinClass(OptionsListContainer, OO.ui.mixin.GroupWidget);

	function determineInputValue(
		schema,
		previousSchema,
		schemaName,
		model,
		data,
		newItem
	) {
		// can be an array, in case of multiselect
		var ret = VisualDataFunctions.isObject( data ) ? null : data;
		// remove value-prefix
		// ***this is not necessary, since is hanlded
		// by applyUntransformed
		// if (defaultValue) {
		// 	if ("value-prefix" in schema.wiki) {
		// 		var prefixLength = schema.wiki["value-prefix"].length;
		// 		if (Array.isArray(defaultValue)) {
		// 			defaultValue = value.map((x) => x.substr(prefixLength));
		// 		} else {
		// 			defaultValue = defaultValue.substr(prefixLength);
		// 		}
		// 	}
		// }

		if (
			!newItem &&
			!isNewSchema( schemaName ) &&
			!Form.emptyData
		) {
			return ret;
		}

		if ( !( 'default' in schema ) ) {
			return ret;
		}

		// if ret is the default of previousSchema
		// update to the default of current schema
		if (
			ret !== null &&
			( !( 'default' in previousSchema ) || ret !== previousSchema.default )
		) {
			return ret;
		}

		// *** in case of array the default values will
		// create the respective entries by OptionsListContainer
		if (
			Array.isArray( schema.default ) &&
				(
					!( 'preferred-input' in schema.wiki ) ||
					!VisualDataFunctions.isMultiselect( schema.wiki[ 'preferred-input' ] )
				)
		) {
			return ret;
		}

		return schema.default;
	}

	function processSchema(
		widget,
		schema,
		previousSchema,
		schemaName,
		model,
		data,
		path,
		pathNoIndex,
		newItem
	) {
		PendingRecursive++;
		if ( !( 'type' in schema ) ) {
			schema.type = 'default' in schema ? 'string' : 'object';
		}
		// model.previousSchema = previousSchema;

		model.schema = VisualDataFunctions.deepCopy( schema );
		model.schemaName = schemaName;
		model.path = path;
		model.pathNoIndex = pathNoIndex;
		// @TODO implement allOf, anyOf, oneOf using addCombinedItem
		// @TODO implement "$ref"

		switch ( schema.type ) {
			case 'object':
				model.properties = {};
				if ( 'properties' in schema ) {

					// data is not an object if the type of schema
					// changed from non object to object, e.g.
					// an array of text fields vs an array
					// of subitems, and the name/key was the same
					if ( !VisualDataFunctions.isObject( data ) ) {
						data = {};
					}

					var items_ = [];
					for ( var i in schema.properties ) {
						if ( !( i in data ) ) {
							data[ i ] = {};
						}
						var path_ = `${ path }/${ escapeJsonPtr( i ) }`;
						applyUntransformed( data, i, path_ );
						var pathNoIndex_ = pathNoIndex ?
							`${ pathNoIndex }/${ escapeJsonPtr( i ) }` :
							escapeJsonPtr( i );
						var item = schema.properties[ i ];
						var previousItem =
							'properties' in previousSchema && i in previousSchema.properties ?
								previousSchema.properties[ i ] :
								{};
						var thisModel = ( model.properties[ i ] = {
							parent: model.properties,
							childIndex: i,
							parentSchema: schema
						} );
						var widget_ = new GroupWidget( {}, { schema: item, path: path_, model: thisModel } );
						processSchema(
							widget_,
							item,
							previousItem,
							schemaName,
							thisModel,
							data[ i ],
							path_,
							pathNoIndex_,
							newItem
						);
						items_.push( widget_ );
					}
					widget.addItems( items_ );
				}
				break;
			case 'array':
				if ( 'items' in schema ) {
					if ( VisualDataFunctions.isObject( schema.items ) ) {
						var item = schema.items;
						model.items = {};
						if ( item.wiki.type === 'property' ) {
							item.wiki.layout = 'table';
						}
						var previousItem =
							'items' in previousSchema ? previousSchema.items : {};

						var optionsListContainer = new OptionsListContainer(
							{},
							schema,
							item,
							previousItem,
							schemaName,
							model.items,
							data,
							path,
							pathNoIndex,
							newItem
						);
						widget.addItems( [ optionsListContainer ] );
					} else {
						// @TODO
						// implement tuple
					}
				}
				break;
			default:
				// 'string',
				// 'number',
				// 'integer',
				// 'boolean',
				// 'null'
				// model.type = "property";
				if ( !( 'wiki' in schema ) ) {
					schema.wiki = {};
				}

				if (
					'visibility' in schema.wiki &&
					schema.wiki.visibility === 'oncreate-only' &&
					Form.options.action !== 'create'
				) {
					delete model.parent[ model.childIndex ];

				} else {
					var inputValue = determineInputValue(
						schema,
						previousSchema,
						schemaName,
						model,
						data,
						newItem
					);

					if ( Array.isArray( inputValue ) ) {
						inputValue = inputValue.filter(
							( x ) => !VisualDataFunctions.isObject( x )
						);
					}

					// used by getFieldAlign
					// model.schema.wiki.schema = schemaName;
					var item = new ItemWidget( {
						classes: [ 'VisualDataItemWidget' ],
						model: model,
						data: inputValue
					} );

					widget.addItems( [ item ] );
				}
		}

		// @TODO implement anyOf, oneOf, allOf
		// https://json-schema.org/understanding-json-schema/reference/combining.html
		// var directives = ["anyOf", "oneOf", "allOf"];
		// for (var directive of directives) {
		// 	if (directive in schema) {
		// 		// *** this is by default an array,
		// 		// but transformed to an object
		// 		for (var i in schema[directive]) {
		// 			var item = schema[directive][i];
		// 			let widget_ = new GroupWidget({}, item);
		// 			processSchema(widget_, item, schemaName, (model[i] = {}));
		// 			if ( directive!=='allOf' ) {
		// 				widget.addCombinedItem(widget_, item.title || i, directive);
		// 			} else {
		// 				widget.addItems([widget_]);
		// 			}
		// 		}
		// 	}
		// }

		QueuedWidgets.push( widget );
		// inform queued widgets that the rendering of the form is complete
		if ( --PendingRecursive === 0 ) {
			// for ( widget_ of QueuedWidgets ) {
			// @see https://www.mediawiki.org/wiki/OOjs/Events

			// widget_.emit( 'formLoaded' );
			if ( QueuedWidgets.length ) {
				QueuedWidgets[ 0 ].emit( 'formLoaded' );
			}
		}
	}

	function getSchemasPanelLayout() {
		Fields = {};
		ModelSchemas = {};
		ModelFlatten = [];
		InputWidgets = {};

		// @TODO implement a better interface between
		// VisualData instance and this constructor
		ProcessModel = new VisualDataProcessModel(
			callbackShowError,
			Form,
			Schemas,
			RecordedSchemas,
			Model,
			ModelSchemas,
			makeElementId
		);

		return new PanelLayout( {
			expanded: true,
			padded: false,
			framed: false,
			// classes: ["PanelProperties-panel-section"],
			data: {
				name: 'schemas',
				schemas: Form.schemas
			}
		} );
	}

	function getArticlePanelLayout() {
		var userDefined = Config.isNewPage && Form.options[ 'edit-page' ] === '';

		var editFreeText = Config.isNewPage && Config.context === 'EditData';
		var editContentModel = Config.context === 'EditData';
		var editCategories = Config.context === 'EditData';
		var editTargetSlot = Config.context === 'EditData';

		var categories = [];

		if ( 'edit-content-model' in Form.options ) {
			editContentModel = Form.options[ 'edit-content-model' ];
		}

		if ( 'edit-categories' in Form.options ) {
			editCategories = Form.options[ 'edit-categories' ]; // !Form.schemas.length || !Config.isNewPage;
		}

		if ( 'edit-freetext' in Form.options ) {
			editFreeText = Form.options[ 'edit-freetext' ];
		}

		if ( 'edit-target-slot' in Form.options ) {
			editTargetSlot = Form.options[ 'edit-target-slot' ];
		}

		if ( editTargetSlot === false &&
			'target-slot' in Form.options &&
			Form.options[ 'target-slot' ] === 'main'
		) {
			editFreeText = false;
			editContentModel = false;
		}

		var fieldAlign = 'top';

		if (
			Form.options.action === 'create' &&
			Form.options[ 'pagename-formula' ] === ''
		) {
			userDefined = true;
		}

		// this will set the fieldAlign of the wiki
		// section as the fieldAlign of last form
		if ( 'layout-align' in Form.options ) {
			fieldAlign = Form.options[ 'layout-align' ];
		}

		// if (Form.options["default-categories"]) {
		// 	categories = Form.options["default-categories"].split(/\s*,\s*/)
		// 		.filter( x => x.trim() !== '' );
		// }
		var categories = (
			'default-categories' in Form.options ?
				Form.options[ 'default-categories' ] :
				[]
		).concat( Form.categories );

		// for some reason appending the method
		// halts the execution combined with mw.loader
		categories = categories.filter( function onlyUnique( value, index, self ) {
			return self.indexOf( value ) === index;
		} );

		// create title and free text input
		if ( !userDefined && !editFreeText && !editCategories && !editContentModel ) {
			return { isEmpty: true };
		}

		return new PanelLayout( {
			expanded: false,
			padded: true,
			framed: false,
			// classes: ["PanelProperties-panel-section"],
			data: {
				name: 'article',
				label: mw.msg( 'visualdata-jsmodule-forms-wiki' ),
				userDefined,
				editFreeText,
				editCategories,
				editContentModel,
				editTargetSlot,
				categories,
				fieldAlign
			}
		} );
	}

	function removeSchemasPanel() {
		var panels = PropertiesStack.getItems();
		for ( var panel of panels ) {
			if ( panel.getData().name === 'schemas' ) {
				PropertiesStack.removeItems( [ panel ] );
				return;
			}
		}
	}

	function updatePanels() {
		ProcessModel.getModel( 'fetch' ).then( function ( res ) {
			Form.jsonData.schemas = $.extend( Form.jsonData.schemas, res );

			removeSchemasPanel();

			var schemasPanelLayout = getSchemasPanelLayout();
			if ( !schemasPanelLayout.isEmpty ) {
				PropertiesStack.addItems( [ schemasPanelLayout ], 0 );
			}

			var panels = PropertiesStack.getItems();

			PropertiesStack.setItem( panels[ 0 ] );

			selectSchema( SelectedSchema, true );

			PropertiesStack.$element.removeClass( [
				'PanelPropertiesStack',
				'PanelPropertiesStack-empty'
			] );

			switch ( panels.length ) {
				case 0:
					PropertiesStack.$element.addClass( 'PanelPropertiesStack-empty' );
					break;
				default:
					PropertiesStack.$element.addClass( 'PanelPropertiesStack' );
			}

			updateButtons( panels );
		} );
	}

	function updateButtons( panels ) {
		if ( TargetSlotField ) {
			TargetSlotField.toggle( hasMultiplePanels() ||
				( 'target-slot' in Model && Model[ 'target-slot' ].getValue() === 'main' ) );
		}

		if ( Form.options.view === 'popup' || Form.options.view === 'button' ) {
			return;
		}
		if ( hasMultiplePanels() ) {
			ValidateButton.toggle( panels.length !== 0 );
			// DeleteButton.toggle( hasStoredJsonData() );
			GoBackButton.toggle( false );
			SubmitButton.toggle( false );
		} else {
			SubmitButton.toggle( panels.length !== 0 );
			// DeleteButton.toggle( hasStoredJsonData() );
			GoBackButton.toggle( false );
			ValidateButton.toggle( false );
		}
	}

	function updateSchemas( previousSchemas, schemas, data ) {
		PreviousSchemas = previousSchemas;
		Schemas = schemas;	// VisualDataFunctions.deepCopy( schemas );

		if ( data && data[ 'result-action' ] === 'rename' ) {
			// *** do not compare Schemas with Form.schemas,
			// since a rename could match an existing entry
			// in Schemas
			// for ( var schemaName in Schemas ) {
			// 	if ( Form.schemas.indexOf( schemaName ) === -1 ) {
			// 		SelectedSchema = schemaName;
			// 		break;
			// 	}
			// }
			SelectedSchema = data.label;

			for ( var i in Form.schemas ) {
				var schemaName = Form.schemas[ i ];
				if ( !( schemaName in Schemas ) ) {
					Form.schemas.splice( i, 1, SelectedSchema );
					if ( !( SelectedSchema in Form.jsonData.schemas ) ) {
						Form.jsonData.schemas[ SelectedSchema ] = Form.jsonData.schemas[ schemaName ];
					}
					delete Form.jsonData.schemas[ schemaName ];
					break;
				}
			}
		}
		// uninitialized
		if ( !( 'getModel' in ProcessModel ) ) {
			return;
		}
		updatePanels();
	}

	async function onSubmit( e ) {
		e.preventDefault();

		var action;
		var formEl = $( this ); // .closest(".VisualDataForm");

		if ( formEl.data( 'delete' ) === true ) {
			action = 'delete';
		} else {
			action = !hasMultiplePanels() ? 'validate&submit' : 'submit';
		}

		ProcessModel.getModel( action ).then( async function ( res ) {
			if ( typeof res === 'boolean' && res === false ) {
				return;
			}

			if ( res.form[ 'target-slot' ] === 'main' && !res.schemas.length &&
				!RecordedSchemas.length ) {
				// eslint-disable-next-line no-alert
				alert( mw.msg( 'visualdata-jsmodule-forms-submit-no-schemas' ) );
				return;
			}

			if ( 'callback' in Form.options && Form.options.callback !== '' ) {
				VisualDataFunctions.executeFunctionByName( Form.options.callback, window, [ res ] );
				return;
			}

			$( '<input>' )
				.attr( {
					type: 'hidden',
					name: 'data',
					value: JSON.stringify( getFormAttributes( res ) )
				} )
				.appendTo( formEl );

			formEl.unbind( 'submit' ).submit();
		} );
	}

	function ProcessDialog( config ) {
		ProcessDialog.super.call( this, config );
	}
	OO.inheritClass( ProcessDialog, OO.ui.ProcessDialog );

	ProcessDialog.static.name = DialogName;
	// ProcessDialog.static.title = mw.msg(
	// 	"visualdata-jsmodule-forms-defineform"
	// );
	ProcessDialog.static.actions = [
		{
			action: 'delete',
			label: mw.msg( 'visualdata-jsmodule-dialog-delete' ),
			flags: 'destructive',
			modes: [ 'validate-delete', 'submit-single-delete' ]
		},
		{
			action: 'validate',
			modes: [ 'validate', 'validate-delete' ],
			label: mw.msg( 'visualdata-jsmodule-dialog-validate' ),
			flags: [ 'primary', 'progressive' ]
		},
		{
			action: 'back',
			label: OO.ui.deferMsg( 'visualdata-jsmodule-dialog-goback' ),
			flags: [ 'safe', 'back' ],
			modes: [ 'submit', 'submit-delete' ]
		},
		{
			action: 'submit',
			label: mw.msg( 'visualdata-jsmodule-dialog-submit' ),
			flags: [ 'primary', 'progressive' ],
			modes: [ 'submit', 'submit-delete' ]
		},
		{
			action: 'validate&submit',
			label: mw.msg( 'visualdata-jsmodule-dialog-submit' ),
			flags: [ 'primary', 'progressive' ],
			modes: [ 'submit-single', 'submit-single-delete' ]
		},
		{
			label: mw.msg( 'visualdata-jsmodule-dialog-close' ),
			flags: [ 'safe', 'close' ],
			modes: [
				'validate',
				'submit-single',
				'validate-delete',
				'submit-single-delete'
			]
		}
	];

	ProcessDialog.prototype.getSetupProcess = function ( data ) {
		// data = data || {};
		// @see https://www.mediawiki.org/wiki/OOUI/Windows/Process_Dialogs
		return ProcessDialog.super.prototype.getSetupProcess
			.call( this, data )
			.next( function () {
				// @see resources/lib/ooui/oojs-ui-windows.js
				this.actions.setMode(
					( hasMultiplePanels() ?
						'validate' :
						'submit-single' ) + ( !hasStoredJsonData() ? '' : '-delete' )
				);

				this.$body.append( data.PropertiesStack.$element );
			}, this );
	};

	ProcessDialog.prototype.initialize = function () {
		ProcessDialog.super.prototype.initialize.apply( this, arguments );
		// this.$body.append(this.data.OuterStack.$element);
		// showVisualEditor();
	};

	ProcessDialog.prototype.getActionProcess = function ( action ) {
		if (
			!action ||
			( action === 'delete' &&
				// eslint-disable-next-line no-alert
				!confirm(
					mw.msg( 'visualdata-jsmodule-forms-delete-data-confirm' )
				) )
		) {
			return ProcessDialog.super.prototype.getActionProcess.call( this, action );
		}
		var self = this;
		return ProcessDialog.super.prototype.getActionProcess
			.call( this, action )
			.next( function () {
				switch ( action ) {
					case 'back':
						var panels = PropertiesStack.getItems();
						PropertiesStack.setItem( panels[ 0 ] );
						self.setSize(
							!( 'popup-size' in Form.options ) ||
								Form.options[ 'popup-size' ] === '' ?
								'medium' :
								Form.options[ 'popup-size' ]
						);
						self.actions.setMode(
							'validate' + ( !hasStoredJsonData() ? '' : '-delete' )
						);
						break;
					case 'validate':
						ProcessModel.getModel( 'validate' ).then( function ( res ) {
							if ( typeof res === 'boolean' ) {
								return;
							}

							var thisPanels = PropertiesStack.getItems();
							PropertiesStack.setItem( thisPanels[ thisPanels.length - 1 ] );
							self.setSize( 'medium' );
							self.actions.setMode(
								'submit' + ( !hasStoredJsonData() ? '' : '-delete' )
							);
						} );
						break;
					case 'validate&submit':
					case 'submit':
					case 'delete':
						return ProcessModel.getModel( action ).then( function ( res ) {
							if ( action.indexOf( 'submit' ) !== 1 && typeof res === 'boolean' ) {
								return;
							}

							var payload = {
								data: JSON.stringify( getFormAttributes( res ) ),
								action: 'visualdata-submit-form'
							};

							return new Promise( ( resolve, reject ) => {
								new mw.Api()
									.postWithToken( 'csrf', payload )
									.done( function ( thisRes ) {
										resolve();
										if ( payload.action in thisRes ) {
											var data = JSON.parse( thisRes[ payload.action ].result );
											if ( !data.errors.length ) {
												WindowManager.closeActiveWindow();
												// @FIXME reload only if the changes affect
												// the current page
												if ( data[ 'target-url' ] === window.location.href ) {
													window.location.reload();
												} else {
													window.location.href = data[ 'target-url' ];
												}
											} else {
												VisualDataFunctions.OOUIAlert(
													new OO.ui.HtmlSnippet( data.errors.join( '<br />' ) ),
													{
														size: 'medium'
													}
												);
											}
										}
									} )
									.fail( function ( thisRes ) {
										// eslint-disable-next-line no-console
										console.error( 'visualdata-submit-form', res );
										reject( thisRes );
									} );

							} );
						} ).catch( ( err ) => {
							VisualDataFunctions.OOUIAlert( `error: ${ err }`, { size: 'medium' } );
						} );
				}
			} );

		// return new OO.ui.Process(function () {
		// 	dialog.close({ action: action });
		// });

		// return ProcessDialog.super.prototype.getActionProcess.call(this, action);
	};

	ProcessDialog.prototype.getTeardownProcess = function ( data ) {
		return ProcessDialog.super.prototype.getTeardownProcess
			.call( this, data )
			.first( function () {
				WindowManager.removeActiveWindow();
			}, this );
	};

	/**
	 * Override getBodyHeight to create a tall dialog relative to the screen.
	 *
	 * @return {number} Body height
	 */
	ProcessDialog.prototype.getBodyHeight = function () {
		// see here https://www.mediawiki.org/wiki/OOUI/Windows/Process_Dialogs
		// this.page1.content.$element.outerHeight( true );
		return window.innerHeight - 100;
	};

	function getFormAttributes( jsondata ) {
		return $.extend(
			{
				formID: FormID,
				config: Config
			},
			jsondata
		);
	}

	function initializePropertiesStack() {
		var panels = [ getSchemasPanelLayout(), getArticlePanelLayout() ].filter(
			( x ) => !x.isEmpty
		);

		var classes = [];

		switch ( panels.length ) {
			case 0:
				classes.push( 'PanelPropertiesStack-empty' );
				break;
			default:
				classes.push( 'PanelPropertiesStack' );
		}

		PropertiesStack = new OO.ui.StackLayout( {
			items: panels,
			continuous: false, // !hasMultiplePanels(),
			expanded: true,
			padded: false,
			// The following classes are used here:
			// * PanelPropertiesStack
			// * PanelPropertiesStack-empty
			classes: classes
		} );

		PropertiesStack.on( 'change', onChangePropertiesStack );
		PropertiesStack.on( 'set', onSetPropertiesStack );
		return panels;
	}

	function hasMultiplePanels() {
		return PropertiesStack && PropertiesStack.getItems().length > 1;
	}

	function hasStoredJsonData() {
		if ( Config.context !== 'EditData' && Form.options.action !== 'edit' ) {
			return false;
		}

		if ( !( 'schemas' in StoredJsonData ) ) {
			return false;
		}
		for ( var i in StoredJsonData.schemas ) {
			if (
				VisualDataFunctions.isObject( StoredJsonData.schemas[ i ] ) &&
				Object.keys( StoredJsonData.schemas[ i ] ).length
			) {
				return true;
			}
		}
		return false;
	}

	function isVisible() {
		return $( '#visualdataform-wrapper-' + FormID ).is( ':visible' );
	}

	function mutationChange() {
		if ( !isVisible() ) {
			Initialized = false;
		} else if ( !Initialized ) {
			initialize();
		}

		for ( var model of ModelFlatten ) {
			updateFieldsVisibility( model );
		}

		// for ( var model of ModelFlatten ) {
		//	updateDependentFields( model );
		// }
	}

	function initialize() {
		if ( !isVisible() ) {
			return false;
		}

		Initialized = true;

		if ( Form.options.view === 'button' ) {

			var button = new OO.ui.ButtonWidget( {
				icon: Form.options.icon,
				flags: [ 'primary', 'progressive' ],
				label: Form.options.label
			} );
			var widget;

			if ( Form.options.schema !== '' ) {
				var editButton = new OO.ui.ButtonWidget( {
					icon: 'edit',
					flags: [ 'primary', 'progressive' ]
				} );

				editButton.on( 'click', function () {
					initializePropertiesStack();

					var thisClasses = [];
					if ( 'css-class' in Form.options && Form.options[ 'css-class' ] !== '' ) {
						thisClasses.push( Form.options[ 'css-class' ] );
					}

					// eslint-disable-next-line mediawiki/class-doc
					var processDialog = new ProcessDialog( {
						size:
							!( 'popup-size' in Form.options ) || Form.options[ 'popup-size' ] === '' ?
								'medium' :
								Form.options[ 'popup-size' ],
						id: 'visualdataform-wrapper-dialog-' + FormID,
						classes: thisClasses
					} );

					WindowManager.newWindow( processDialog, {
						title: Form.options.title,
						PropertiesStack: PropertiesStack
					} );
				} );

				widget = new OO.ui.ActionFieldLayout( button, editButton, {
					label: '',
					align: 'top',
					classes: [ 'VisualDataPageButtonsActionField' ]
				} );

			} else {
				widget = button;
			}

			button.on( 'click', function () {
				var args = [ Form.options.value ];

				if ( Form.options.schema !== '' && schemaHasData( Form.options.schema ) ) {
					// initializePropertiesStack();
					// ProcessModel.getModel( 'schema', Form.options.schema ).then( async function ( res ) {
					// 	if ( typeof res === 'boolean' && res === false ) {
					// 		return;
					// 	}
					// 	args.push( res.data );
					// 	VisualDataFunctions.executeFunctionByName( Form.options.callback, window, args );
					// } );
					args.push( StoredJsonData.schemas[ Form.options.schema ] );
				}
				VisualDataFunctions.executeFunctionByName( Form.options.callback, window, args );
			} );

			$( '#visualdataform-wrapper-' + FormID ).html( widget.$element );

			return true;
		}

		if ( Form.options.view === 'popup' ) {
			var popupButton = new OO.ui.ButtonWidget( {
				icon: 'edit',
				label: Form.options.title
			} );

			popupButton.on( 'click', function () {
				initializePropertiesStack();

				var thisClasses = [];
				if ( 'css-class' in Form.options && Form.options[ 'css-class' ] !== '' ) {
					thisClasses.push( Form.options[ 'css-class' ] );
				}

				// eslint-disable-next-line mediawiki/class-doc
				var processDialog = new ProcessDialog( {
					size:
						!( 'popup-size' in Form.options ) || Form.options[ 'popup-size' ] === '' ?
							'medium' :
							Form.options[ 'popup-size' ],
					id: 'visualdataform-wrapper-dialog-' + FormID,
					classes: thisClasses
				} );

				WindowManager.newWindow( processDialog, {
					title: Form.options.title,
					PropertiesStack: PropertiesStack
				} );
			} );
			$( '#visualdataform-wrapper-' + FormID ).html( popupButton.$element );

			return true;
		}

		var formContent = [];

		if ( Form.errors.length ) {
			var messageWidget = new OO.ui.MessageWidget( {
				type: 'error',
				label: new OO.ui.HtmlSnippet( Form.errors.join( '<br /> ' ) )
			} );

			formContent.push( messageWidget.$element );
			formContent.push( $( '<br>' ) );
		}

		var panels = initializePropertiesStack();

		SubmitButton = new OO.ui.ButtonInputWidget( {
			label:
				!( 'submit-button-text' in Form.options ) ||
				Form.options[ 'submit-button-text' ] === '' ?
					mw.msg( 'visualdata-jsmodule-forms-submit' ) :
					Form.options[ 'submit-button-text' ],

			flags: [ 'primary', 'progressive' ],
			classes: [ 'VisualDataFormSubmitButton' ],
			type: 'submit'
		} );

		formContent.push( PropertiesStack.$element );
		formContent.push( SubmitButton.$element );

		ValidateButton = new OO.ui.ButtonInputWidget( {
			label:
				!( 'validate-button-text' in Form.options ) ||
				Form.options[ 'validate-button-text' ] === '' ?
					mw.msg( 'visualdata-jsmodule-forms-validate' ) :
					Form.options[ 'validate-button-text' ],
			classes: [ 'VisualDataFormSubmitButton' ],
			flags: [ 'primary', 'progressive' ]
			// type: "submit",
		} );

		ValidateButton.on( 'click', function () {
			ProcessModel.getModel( 'validate' ).then( function ( res ) {
				if ( typeof res === 'boolean' && res === false ) {
					return;
				}

				var thisPanels = PropertiesStack.getItems();
				PropertiesStack.setItem( thisPanels[ thisPanels.length - 1 ] );

				ValidateButton.toggle( false );
				SubmitButton.toggle( true );
				GoBackButton.toggle( true );
				// DeleteButton.toggle( false );
				$( '#visualdataform-wrapper-' + FormID )
					.get( 0 )
					.scrollIntoView( { behavior: 'smooth' } );
			} );
		} );

		formContent.push( ValidateButton.$element );

		// var printDeleteButton = hasStoredJsonData();

		// DeleteButton = new OO.ui.ButtonInputWidget( {
		// 	label: mw.msg( 'visualdata-jsmodule-forms-delete' ),
		// 	classes: [ 'VisualDataFormSubmitButton' ],
		// 	flags: [ 'destructive' ],
		// 	type: 'submit'
		// } );

		// formContent.push( DeleteButton.$element );

		GoBackButton = new OO.ui.ButtonInputWidget( {
			label: mw.msg( 'visualdata-jsmodule-forms-goback' ),
			classes: [ 'VisualDataFormSubmitButton' ],
			flags: [ 'progressive' ],
			icon: 'arrowPrevious'
		} );

		GoBackButton.on( 'click', function () {
			var thisPanels = PropertiesStack.getItems();
			PropertiesStack.setItem( thisPanels[ 0 ] );

			ValidateButton.toggle( true );
			SubmitButton.toggle( false );
			GoBackButton.toggle( false );
			// DeleteButton.toggle( hasStoredJsonData() );

			$( '#visualdataform-wrapper-' + FormID )
				.get( 0 )
				.scrollIntoView( { behavior: 'smooth' } );
		} );

		formContent.push( GoBackButton.$element );

		updateButtons( panels );

		var classes = [
			'VisualDataForm',
			'VisualDataFormContext-' + Config.context
		];

		if ( 'css-class' in Form.options && Form.options[ 'css-class' ] !== '' ) {
			classes.push( Form.options[ 'css-class' ] );
		}

		// eslint-disable-next-line mediawiki/class-doc
		var form = new OO.ui.FormLayout( {
			action: Config.actionUrl,
			method: 'post',
			enctype: 'multipart/form-data',
			$content: formContent,
			classes: classes,
			data: { name: 'visualdata' }
		} );

		// DeleteButton.on( 'click', function () {
		// 	if (
		// 		// eslint-disable-next-line no-alert
		// 		confirm(
		// 			mw.msg( 'visualdata-jsmodule-forms-delete-data-confirm' )
		// 		)
		// 	) {
		// 		form.$element.data( { delete: true } );
		// 		form.$element.trigger( 'submit' );
		// 	}

		// VisualDataFunctions.OOUIAlert(
		// 	new OO.ui.HtmlSnippet(
		// 		mw.msg("visualdata-jsmodule-visualdata-delete-data-confirm")
		// 	),
		// 	{ size: "medium" },
		// 	function () {
		// 		form.$element.data({ delete: true });
		// 		form.$element.submit();
		// 	}
		// );
		// } );

		form.$element.on( 'submit', onSubmit );

		var editToolbar = Config.canmanageschemas || Config.caneditdata;

		if ( Config.context === 'parserfunction' || !editToolbar ) {
			$( '#visualdataform-wrapper-' + FormID ).html( form.$element );

			// eslint-disable-next-line no-jquery/no-global-selector
			$( '#mw-rcfilters-spinner-wrapper' ).remove();
			// showVisualEditor();

			return true;
		}

		var items = [];
		ToolbarMain = createToolbar( Config.context === 'EditData' );

		var frameA = new OO.ui.PanelLayout( {
			$content: [ ToolbarMain.$element, form.$element ],
			expanded: false,
			framed: false,
			padded: false,
			data: { name: 'visualdata' }
		} );

		items.push( frameA );

		if ( Config.canmanageschemas ) {
			ActionToolbarMain = createActionToolbar( Config.context === 'EditData' );
			ToolbarMain.$actions.append( ActionToolbarMain.$element );

			// https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/c2805c7e9e83e2f3a857451d46c80231d1658a0f/demos/pages/layouts.js
			var toolbarSchemas = VisualDataSchemas.createToolbarA();
			var contentSchemas = new OO.ui.PanelLayout( {
				$content: $(
					'<table id="visualdata-schemas-datatable" class="visualdata-datatable display" width="100%"></table>'
				),
				expanded: false,
				framed: true,
				padded: true,
				classes: [ 'VisualDataEditDataOuterStackPanel' ]
			} );

			var frameSchemas = new OO.ui.PanelLayout( {
				$content: [ toolbarSchemas.$element, contentSchemas.$element ],
				expanded: false,
				framed: false,
				padded: false,
				data: { name: 'manage-schemas' }
			} );

			items.push( frameSchemas );
		}

		// if (Config.canmanageforms) {
		// 	var toolbarForms = VisualDataForms.createToolbarA();
		// 	var contentForms = new OO.ui.PanelLayout({
		// 		$content: $(
		// 			'<table id="visualdata-forms-datatable" class="visualdata-datatable display" width="100%"></table>'
		// 		),
		// 		expanded: false,
		// 		padded: true,
		// 	});
		//
		// 	var frameForms = new OO.ui.PanelLayout({
		// 		$content: [toolbarForms.$element, contentForms.$element],
		// 		expanded: false,
		// 		framed: true,
		// 		data: { name: "manage-forms" },
		// 	});
		//
		// 	items.push(frameForms);
		// }

		OuterStack = new OO.ui.StackLayout( {
			items: items,
			expanded: false,
			continuous: false
			// classes: ["visualdataform-wrapper"],
		} );

		if ( Config.canmanageschemas ) {
			var actionToolbarSchemas = createActionToolbar(
				Config.context === 'EditData'
			);
			toolbarSchemas.$actions.append( actionToolbarSchemas.$element );
		}

		// if (Config.canmanageforms) {
		// 	var actionToolbarForms = createActionToolbar();
		// 	toolbarForms.$actions.append(actionToolbarForms.$element);
		// }

		$( '#visualdataform-wrapper-' + FormID ).html( OuterStack.$element );

		ToolbarMain.initialize();

		if ( Config.canmanageschemas ) {
			toolbarSchemas.initialize();
		}

		// if (Config.canmanageforms) {
		// 	toolbarForms.initialize();
		// }

		$( '#mw-rcfilters-spinner-wrapper' ).remove();

		// showVisualEditor();

		return true;
	}

	return {
		initialize,
		getCategories,
		// updateForms,
		updateSchemas,
		updatePanels,
		mutationChange
	};
};

$( function () {
	var schemas = JSON.parse( mw.config.get( 'visualdata-schemas' ) );
	// console.log("schemas", schemas);

	var submissionData = JSON.parse(
		mw.config.get( 'visualdata-submissiondata' )
	);
	// console.log("submissionData", submissionData);

	var pageForms = JSON.parse( mw.config.get( 'visualdata-pageforms' ) );
	// console.log("pageForms", pageForms);

	var config = JSON.parse( mw.config.get( 'visualdata-config' ) );
	// console.log("config", config);

	var windowManager = new VisualDataWindowManager();

	if ( !submissionData ) {
		submissionData = {};
	}

	function init() {
		var instances = [];

		for ( var formID in pageForms ) {
			var form = pageForms[ formID ];

			form = $.extend(
				{
					freetext: '',
					jsonData: {},
					categories: [],
					errors: [],
					schemas: [],
					options: {}
				},
				form
			);

			if ( formID in submissionData ) {
				form = $.extend(
					form,
					submissionData[ formID ]
				);
			}

			var visualDataForm = new VisualDataForms(
				config,
				form,
				formID,
				schemas,
				windowManager
			);

			visualDataForm.initialize();

			if ( config.context === 'parserfunction' && form.errors.length ) {
				$( '#visualdataform-wrapper-' + formID )
					.get( 0 )
					.scrollIntoView();
			}

			instances.push( visualDataForm );
		}

		// *** this allows to render forms when they
		// are contained within not visible elements
		// like datatables cells, or dialogs
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

		if ( MutationObserver ) {
			var observer = new MutationObserver( function ( mutations, thisObserver ) {
				for ( var instance of instances ) {
					instance.mutationChange();
				}
			} );

			observer.observe( document, {
				subtree: true,
				childList: true
			} );
		}

		return instances;
	}

	if ( !config.canmanageschemas ) {
		VisualData.setVars( config, schemas, init() );

	} else {
		mw.loader.using( 'ext.VisualData.ManageSchemas', function () {
			var instances = init();
			VisualData.setVars( config, schemas, instances );
			VisualDataSchemas.setVars(
				config,
				windowManager,
				schemas,
				instances
			);
		} );
	}

} );
