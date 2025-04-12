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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VisualData. If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright © 2021-2024, https://wikisphere.org
 */

/* eslint-disable no-tabs */

// eslint-disable-next-line no-implicit-globals
VisualData = ( function () {
	var VisualDataForms = {};
	var Schemas = {};
	var Config;

	function matchLoadedData( config, dataToLoad ) {
		return dataToLoad.filter( ( x ) => !VisualDataFunctions.inArray( x, config.loadedData ) );
	}

	function adjustSchemas( schemas ) {
		// adjust schema, to ensure it can be handled
		// @FIXME put in VisualDataSchemas, redesign assignement
		// to Schemas in VisualDataForms -> loadDataBeforeSelect
		for ( var i in schemas ) {
			if ( !( 'wiki' in schemas[ i ] ) ) {
				schemas[ i ].wiki = {};
			}
			if ( !( 'name' in schemas[ i ].wiki ) ) {
				schemas[ i ].wiki.name = i;
			}
		}
	}

	function loadData( config, dataToLoad ) {
		return new Promise( ( resolve, reject ) => {
			var payload = {
				action: 'visualdata-load-data',
				dataset: dataToLoad.join( '|' ),
				'source-page': mw.config.get( 'wgPageName' ),
				format: 'json'
			};
			new mw.Api()
				.postWithToken( 'csrf', payload )
				.done( function ( res ) {
					if ( payload.action in res ) {
						var data = res[ payload.action ];
						for ( var i in data ) {
							data[ i ] = JSON.parse( data[ i ] );
						}
						if ( 'schemas' in data ) {
							adjustSchemas( data.schemas );
						}
						config.loadedData = config.loadedData.concat( dataToLoad );
						resolve( data );
					} else {
						reject();
					}
				} )
				.fail( function ( res ) {
					// eslint-disable-next-line no-console
					console.error( 'visualdata-load-data error', res );
					reject( res );
				} );
		} );
		// *** catch is performed in the calling function
		// .catch( ( err ) => {
		// 	VisualDataFunctions.OOUIAlert( `error: ${ err }`, { size: 'medium' } );
		// } );
	}

	function loadSchemas( schemas ) {
		var payload = {
			action: 'visualdata-get-schemas',
			schemas: schemas.join( '|' )
		};
		var previousSchemas = VisualDataFunctions.deepCopy( Schemas );
		return new Promise( ( resolve, reject ) => {
			new mw.Api()
				.postWithToken( 'csrf', payload )
				.done( function ( res ) {
					if ( payload.action in res ) {
						var thisSchemas = JSON.parse( res[ payload.action ].schemas );
						adjustSchemas( thisSchemas );
						for ( var i in thisSchemas ) {
							Schemas[ i ] = thisSchemas[ i ];
						}
						resolve( thisSchemas );
						for ( var i in VisualDataForms ) {
							VisualDataForms[ i ].updateSchemas( previousSchemas, Schemas );
						}
					}
				} )
				.fail( function ( res ) {
					// eslint-disable-next-line no-console
					console.error( 'visualdata-get-schemas', res );
					reject( res );
				} );
		} ).catch( ( err ) => {
			VisualDataFunctions.OOUIAlert( `error: ${ err }`, { size: 'medium' } );
		} );
	}

	function setVars( config, schemas ) {
		Config = config;
		Schemas = schemas;
	}

	function setForms( instances ) {
		VisualDataForms = instances;
	}

	function updateSchemas( data, action ) {
		var previousSchemas = VisualDataFunctions.deepCopy( Schemas );

		switch ( action ) {
			case 'update':
				Schemas = jQuery.extend( Schemas, data.schemas );
				break;

			case 'delete':
				if ( data[ 'deleted-schema' ] in Schemas ) {
					delete Schemas[ data[ 'deleted-schema' ] ];
				}
				break;

			case 'create':
				Schemas = jQuery.extend( Schemas, data.schemas );
				Schemas = VisualDataFunctions.sortObjectByKeys( Schemas );
				break;

			case 'rename':
				delete Schemas[ data[ 'previous-label' ] ];
				Schemas = jQuery.extend( Schemas, data.schemas );
				Schemas = VisualDataFunctions.sortObjectByKeys( Schemas );
				break;
		}

		if ( Config.context !== 'ManageSchemas' ) {
			for ( var i in VisualDataForms ) {
				VisualDataForms[ i ].updateSchemas( previousSchemas, Schemas, data );
			}
		}

		return Schemas;
	}

	return {
		loadData,
		loadSchemas,
		setVars,
		updateSchemas,
		matchLoadedData,
		setForms
	};
}() );
