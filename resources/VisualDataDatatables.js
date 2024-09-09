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
 * @copyright Copyright © 2024, https://wikisphere.org
 */

/* eslint-disable no-unused-vars */

const VisualDataDatatables = function () {
	var cacheLimit = 40000;

	var getCacheKey = function ( obj ) {
		// this ensures that the preload key
		// and the dynamic key match
		// this does not work: "searchPanes" in obj && Object.entries(obj.searchPanes).find(x => Object.keys(x).length ) ? obj.searchPanes : {},
		if ( 'searchPanes' in obj ) {
			for ( var i in obj.searchPanes ) {
				if ( !Object.keys( obj.searchPanes[ i ] ).length ) {
					delete obj.searchPanes[ i ];
				}
			}
		}

		return objectHash.sha1( {
			order: obj.order.map( ( x ) => {
				return { column: x.column, dir: x.dir };
			} ),
			// search: obj.search,
			searchPanes:
				'searchPanes' in obj &&
				VisualDataFunctions.objectEntries( obj.searchPanes ).find( ( x ) => Object.keys( x ).length ) ?
					obj.searchPanes :
					{},
			searchBuilder: 'searchBuilder' in obj ? obj.searchBuilder : {}
		} );
	};

	var callApi = function (
		data,
		callback,
		preloadData,
		searchPanesOptions,
		displayLog
	) {
		if ( displayLog ) {
			// eslint-disable-next-line no-console
			console.log( 'payload data', data );
		}

		var payload = {
			action: 'visualdata-datatables',
			data: JSON.stringify( data )
		};

		new mw.Api()
			.postWithToken( 'csrf', payload )
			.done( function ( res ) {
				var json = res[ payload.action ].result;
				var log = res[ payload.action ].log;

				if ( displayLog ) {
					// eslint-disable-next-line no-console
					console.log( 'json', json );
					// eslint-disable-next-line no-console
					console.log( 'log', log );
				}

				// cache all retrieved rows for each sorting
				// dimension (column/dir), up to a fixed
				// threshold (cacheLimit)

				if ( data.datatableData.search.value === '' ) {
					preloadData[ json.cacheKey ] = {
						data: preloadData[ json.cacheKey ].data
							.slice( 0, data.datatableData.start )
							.concat( json.data ),
						count: json.recordsFiltered
					};
				}

				// we retrieve more than "length"
				// expected by datatables, so return the
				// sliced result
				json.data = json.data.slice( 0, data.datatableData.datalength );
				json.searchPanes = {
					options: searchPanesOptions
				};
				callback( json );
			} )
			.fail( function ( error ) {
				// eslint-disable-next-line no-console
				console.error( 'visualdata-datatables', error );
			} );
	};

	function objectValues( obj ) {
		return Object.keys( obj ).map( function ( e ) {
			return obj[ e ];
		} );
	}

	var initColumnSort = function ( table, order, headers ) {
		var ret = [];
		// eg. new_property asc, new_property_2 desc
		var values = order.split( /\s*,\s*/ );

		// @see QueryProcessor -> getOptions
		for ( var i in values ) {
			var match = values[ i ].match( /^\s*(.+?)\s*(ASC|DESC)?\s*$/i );
			var propName = match[ 1 ];
			var sort = match[ 2 ] ? match[ 2 ] : 'ASC';
			var index = Object.keys( headers ).indexOf( propName );
			if ( index !== -1 ) {
				ret.push( [ index, sort.toLowerCase() ] );
			}
		}
		if ( ret.length > 0 ) {
			table.data( 'order', ret );
		} else {
			// default @see https://datatables.net/reference/option/order
			table.data( 'order', [ [ 0, 'asc' ] ] );
		}
	};

	var initSearchPanesColumns = function ( columnDefs, conf ) {
		for ( var i in columnDefs ) {
			if ( !( 'searchPanes' in columnDefs[ i ] ) ) {
				columnDefs[ i ].searchPanes = {};
			}

			if (
				'show' in columnDefs[ i ].searchPanes &&
				columnDefs[ i ].searchPanes.show === false
			) {
				delete columnDefs[ i ].searchPanes;
				continue;
			}

			if (
				'columns' in conf.searchPanes &&
				conf.searchPanes.columns.length &&
				$.inArray( i * 1, conf.searchPanes.columns ) < 0
			) {
				delete columnDefs[ i ].searchPanes;
				continue;
			}

			columnDefs[ i ].searchPanes.show = true;
		}
	};

	// this is used only if Ajax is disabled and
	// the table does not have fields with multiple values
	var getPanesOptions = function ( data, columnDefs, conf ) {
		var ret = {};
		var dataLength = {};
		var div = document.createElement( 'div' );

		for ( var i in columnDefs ) {
			if ( 'searchPanes' in columnDefs[ i ] ) {
				ret[ i ] = {};
				dataLength[ i ] = 0;
			}
		}

		for ( var i in data ) {
			for ( var ii in ret ) {
				var key = Object.keys( data[ i ] )[ ii ];

				if ( data[ i ][ key ] === '' ) {
					if ( !conf.searchPanes.showEmpty ) {
						continue;
					}
				}
				dataLength[ ii ]++;
				var label;
				if ( conf.searchPanes.htmlLabels === false ) {
					div.innerHTML = data[ i ][ key ];
					label = div.textContent || div.innerText || '';
				} else {
					label = data[ i ][ key ];
				}

				// this will exclude images as well if
				// conf.searchPanes.htmlLabels === false
				if ( label === '' ) {
					if ( !conf.searchPanes.showEmpty ) {
						continue;
					} else {
						label = `<i>${ conf.searchPanes.emptyMessage }</i>`;
					}
				}

				if ( !( data[ i ][ key ] in ret[ ii ] ) ) {
					ret[ ii ][ data[ i ][ key ] ] = {
						label: label,
						value: data[ i ][ key ],
						count: 0
					};
				}

				ret[ ii ][ data[ i ][ key ] ].count++;
			}
		}

		for ( var i in ret ) {
			var threshold =
				'threshold' in columnDefs[ i ].searchPanes ?
					columnDefs[ i ].searchPanes.threshold :
					conf.searchPanes.threshold;

			// @see https://datatables.net/extensions/searchpanes/examples/initialisation/threshold.htm
			// @see https://github.com/DataTables/SearchPanes/blob/818900b75dba6238bf4b62a204fdd41a9b8944b7/src/SearchPane.ts#L824
			// _uniqueRatio
			var binLength = Object.keys( ret[ i ] ).length;
			// data.length;
			var uniqueRatio = binLength / dataLength[ i ];

			//  || binLength <= 1
			if ( uniqueRatio > threshold ) {
				delete ret[ i ];
				continue;
			}

			ret[ i ] = objectValues( ret[ i ] ).filter(
				( x ) => x.count >= conf.searchPanes.minCount
			);

			if ( !ret[ i ].length ) {
				delete ret[ i ];
			}
		}

		for ( var i in columnDefs ) {
			if ( !( i in ret ) ) {
				// delete columnDefs[i].searchPanes;
				columnDefs[ i ].searchPanes = { show: false };
			}
		}

		// *** doesn't have effect
		for ( var i in ret ) {
			ret[ i ].sort( function ( a, b ) {
				if ( a.value === '' && b.value !== '' ) {
					return -1;
				}
				if ( a.value !== '' && b.value === '' ) {
					return 1;
				}
				return 0;
			} );
		}

		return ret;
	};

	var setPanesOptions = function ( data, searchPanesOptions, columnDefs ) {
		for ( let i in searchPanesOptions ) {
			// @see https://datatables.net/reference/option/columns.searchPanes.combiner
			columnDefs[ i ].searchPanes.combiner =
				'combiner' in columnDefs[ i ].searchPanes ?
					columnDefs[ i ].searchPanes.combiner :
					'or';
			columnDefs[ i ].searchPanes.options = [];

			// @see https://datatables.net/reference/option/columns.searchPanes.options
			for ( let ii in searchPanesOptions[ i ] ) {
				columnDefs[ i ].searchPanes.options.push( {
					label: searchPanesOptions[ i ][ ii ].label,
					value: function ( rowData, rowIdx ) {
						// return rowData[i] === searchPanesOptions[i][ii].value;
						return (
							objectValues( data[ rowIdx ] )[ i ] === searchPanesOptions[ i ][ ii ].value
						);
					}
				} );
			}

			// @TODO sort panes after rendering using the following
			// https://github.com/DataTables/SearchPanes/blob/master/src/SearchPane.ts
		}
	};

	var searchPanesOptionsServer = function (
		searchPanesOptions,
		columnDefs,
		conf
	) {
		function indexFromPrintout( printout ) {
			for ( var thisIndex in columnDefs ) {
				if ( columnDefs[ thisIndex ].name === printout ) {
					return thisIndex;
				}
			}
			return -1;
		}
		var ret = {};
		for ( var i in searchPanesOptions ) {
			var index = indexFromPrintout( i );
			if ( index !== -1 ) {
				ret[ index ] = searchPanesOptions[ i ];
			}
		}

		var div = document.createElement( 'div' );
		for ( var i in ret ) {
			if ( !( 'searchPanes' in columnDefs[ i ] ) ) {
				columnDefs[ i ].searchPanes = {};
			}
			columnDefs[ i ].searchPanes.show = Object.keys( ret[ i ] ).length > 0;

			for ( var ii in ret[ i ] ) {
				if ( conf.searchPanes.htmlLabels === false ) {
					div.innerHTML = ret[ i ][ ii ].label;
					ret[ i ][ ii ].label = div.textContent || div.innerText || '';
				}

				ret[ i ][ ii ].total = ret[ i ][ ii ].count;
			}
		}

		for ( var i in columnDefs ) {
			if ( 'searchPanes' in columnDefs[ i ] && !( columnDefs[ i ].name in ret ) ) {
				delete columnDefs[ i ].searchPanes;
			}
		}

		return ret;
	};

	return {
		getCacheKey,
		callApi,
		cacheLimit,
		initSearchPanesColumns,
		getPanesOptions,
		setPanesOptions,
		initColumnSort,
		searchPanesOptionsServer
	};
};

$( function () {
	var visualdataDatatables = new VisualDataDatatables();

	$( '.visualdata.datatable' ).each( function () {
		var preloadData = {};

		var table = $( this );
		var tableData = table.data();
		var count = tableData.count;
		var conf = tableData.conf;
		var query = tableData.query;
		var data = tableData.json;
		var printouts = tableData.printouts;
		var templates = tableData.templates;
		// var params = tableData.params;
		var mapPathSchema = tableData.mapPathSchema;
		var headers = tableData.headers;
		var printoutsOptions = tableData.printoutsOptions;
		var searchPanesOptions = tableData.searchPanesOptions;
		var useAjax = count > data.length;

		var displayLog = false;
		if ( displayLog ) {
			// eslint-disable-next-line no-console
			console.log( 'tableData', tableData );
		}
		visualdataDatatables.initColumnSort( table, query.params.order, headers );
		var order = table.data( 'order' );

		function isObject( obj ) {
			return obj !== null && typeof obj === 'object' && !Array.isArray( obj );
		}

		if ( isObject( conf.scroller ) ) {
			if ( !( 'scrollY' in conf ) || !conf.scrollY ) {
				conf.scrollY = '300px';

				// expected type is string
			} else if ( !isNaN( conf.scrollY ) ) {
				conf.scrollY = conf.scrollY + 'px';
			}
		}

		var searchPanes = isObject( conf.searchPanes );

		var searchBuilder = conf.searchBuilder;
		if ( searchBuilder ) {
			// if (options.dom.indexOf("Q") === -1) {
			// options.dom = "Q" + options.dom;
			// }

			// @see https://datatables.net/extensions/searchbuilder/customConditions.html
			// @see https://github.com/DataTables/SearchBuilder/blob/master/src/searchBuilder.ts
			conf.searchBuilder = {
				depthLimit: 1,
				conditions: {
					html: {
						null: null
					},
					string: {
						null: null
					},
					date: {
						null: null
					},
					num: {
						null: null
					}
				}
			};
		}

		// add the pagelength at the proper place in the length menu
		if ( $.inArray( conf.pageLength, conf.lengthMenu ) < 0 ) {
			conf.lengthMenu.push( conf.pageLength );
			conf.lengthMenu.sort( function ( a, b ) {
				return a - b;
			} );
		}

		// datatables columns.type
		// https://datatables.net/reference/option/columns.type
		/*
string
date
num
num-fmt
html
html-fmt
html-num-fmt
*/
		var index = 0;
		var columnDefs = [];
		for ( var key in headers ) {
			var datatablesFormat;
			var columnType;
			// mainlabel
			if ( key !== '' ) {
				columnType = mapPathSchema[ key ].type;
				switch ( mapPathSchema[ key ].type ) {
					case 'boolean':
						datatablesFormat = 'string';
						columnType = 'boolean';
						break;

					case 'string':
						columnType = mapPathSchema[ key ].format;
						switch ( mapPathSchema[ key ].format ) {
							case 'color':

							case 'date':
							case 'datetime':
							case 'datetime-local':
								datatablesFormat = 'date';
							case 'email':

							case 'month':
							case 'number':
							case 'week':
								datatablesFormat = 'num';
								break;

							case 'password':
							case 'range':
							case 'tel':
							case 'text':
							case 'textarea':
							case 'time':
								datatablesFormat = 'string';
								break;
							case 'url':
								datatablesFormat = 'html';
								break;
							default:
								datatablesFormat = 'string';
						}
						break;
					case 'number':
					case 'integer':
						datatablesFormat = 'num';
						break;
					default:
						datatablesFormat = 'string';
				}
			} else {
				columnType = 'page title';
				datatablesFormat = 'html';
			}

			if ( !conf.columns.type ) {
				// @TODO use "any-number" for numeric values
				conf.columns.type = null;
			}

			columnDefs.push(
				$.extend(
					{
						// https://datatables.net/reference/option/columnDefs
						// data: ...
						title: headers[ key ],
						name: key,
						className: 'schema-type-' + columnType,
						targets: [ index ],

						// @FIXME https://datatables.net/reference/option/columns.searchBuilderType
						// implement in the proper way
						searchBuilderType: datatablesFormat
					},
					conf.columns,
					printoutsOptions[ key ]
				)
			);
			index++;
		}

		if ( searchPanes ) {
			// https://datatables.net/reference/option/layout
			// https://datatables.net/examples/layout/ids-and-classes.html
			conf.layout.top1 = {
				// whatever class
				rowClass: 'row-class',
				features: 'searchPanes'
			};

			visualdataDatatables.initSearchPanesColumns( columnDefs, conf );

			if ( !useAjax ) {
				searchPanesOptions = visualdataDatatables.getPanesOptions(
					data,
					columnDefs,
					conf
				);
				visualdataDatatables.setPanesOptions(
					data,
					searchPanesOptions,
					columnDefs
				);
			} else {
				searchPanesOptions = visualdataDatatables.searchPanesOptionsServer(
					searchPanesOptions,
					columnDefs,
					conf
				);
			}
		}

		conf.columnDefs = columnDefs;

		if ( !useAjax ) {
			conf.serverSide = false;
			conf.data = data;

			// use Ajax only when required
		} else {
			// prevents double spinner
			// $(container).find(".datatables-spinner").hide();

			var preloadData = {};

			// cache using the column index and sorting
			// method, as pseudo-multidimensional array
			// column index + dir (asc/desc) + searchPanes (empty selection)
			var cacheKey = visualdataDatatables.getCacheKey( {
				order: order.map( ( x ) => {
					return { column: x[ 0 ], dir: x[ 1 ] };
				} )
			} );

			preloadData[ cacheKey ] = {
				data,
				count: count
			};

			var payloadData = {
				query,
				columnDefs,
				printouts,
				// params,
				templates,
				sourcePage: mw.config.get( 'wgPageName' ),
				settings: { count, displayLog }
			};

			conf = $.extend( conf, {
				// *** attention! deferLoading when used in conjunction with
				// ajax, expects only the first page of data, if the preloaded
				// data contain more rows, datatables will show a wrong rows
				// counter. For this reason we renounce to use deferRender, and
				// instead we use the following hack: the Ajax function returns
				// the preloaded data as long they are available for the requested
				// slice, and then it uses an ajax call for not available data.
				// deferLoading: table.data("count"),
				processing: true,
				serverSide: true,
				ajax: function ( datatableData, callback, settings ) {
					// must match initial cacheKey
					var thisCacheKey = visualdataDatatables.getCacheKey( datatableData );

					if ( !( thisCacheKey in preloadData ) ) {
						preloadData[ thisCacheKey ] = { data: [] };
					}

					// returned cached data for the required
					// dimension (order column/dir)
					if (
						datatableData.search.value === '' &&
						datatableData.start + datatableData.length <=
							preloadData[ thisCacheKey ].data.length
					) {
						return callback( {
							draw: datatableData.draw,
							data: preloadData[ thisCacheKey ].data.slice(
								datatableData.start,
								datatableData.start + datatableData.length
							),
							recordsTotal: count,
							recordsFiltered: preloadData[ thisCacheKey ].count,
							searchPanes: {
								options: searchPanesOptions
							}
						} );
					}
					// flush cache each 40,000 rows
					// *** another method is to compute the actual
					// size in bytes of each row, but it takes more
					// resources
					for ( var i in preloadData ) {
						var totalSize = preloadData[ i ].data.length;

						if ( totalSize > VisualDataDatatables.cacheLimit ) {
							// eslint-disable-next-line no-console
							console.log( 'flushing datatables cache!' );
							preloadData[ i ] = {};
						}
					}

					visualdataDatatables.callApi(
						$.extend( payloadData, {
							datatableData,
							cacheKey: thisCacheKey
						} ),
						callback,
						preloadData,
						searchPanesOptions,
						displayLog
					);
				}
			} );
		}
		if ( displayLog ) {
			// eslint-disable-next-line no-console
			console.log( 'conf', conf );
		}
		$( this ).DataTable( conf );
	} );
} );
