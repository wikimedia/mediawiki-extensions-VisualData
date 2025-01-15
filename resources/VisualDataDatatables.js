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

const VisualDataDatatables = function ( el ) {
	var Datatable;
	var CacheLimit = 40000;
	var Table = $( el );
	var TableData = Table.data();
	var SynchInterval;
	var FaviconHref;
	var DatatableLibrary = $.fn.dataTable.ext;

	var getCacheLimit = function ( obj ) {
		return CacheLimit;
	};

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

	// @credits https://stackoverflow.com/questions/32692618/how-to-export-all-rows-from-datatables-using-ajax
	var exportAction = function ( e1, dt, button, config ) {
		var self = this;
		// eslint-disable-next-line no-underscore-dangle
		var oldStart = dt.settings()[ 0 ]._iDisplayStart;
		var buttonClass = config.className.split( ' ' ).shift();

		var funcName = null;
		switch ( buttonClass ) {
			case 'buttons-copy':
				funcName = 'copyHtml5';
				break;
			case 'buttons-excel':
				funcName = ( DatatableLibrary.buttons.excelHtml5.available( dt, config ) ? 'excelHtml5' : 'excelFlash' );
				break;
			case 'buttons-csv':
				funcName = ( DatatableLibrary.buttons.csvHtml5.available( dt, config ) ? 'csvHtml5' : 'csvFlash' );
				break;
			case 'buttons-pdf':
				funcName = ( DatatableLibrary.buttons.pdfHtml5.available( dt, config ) ? 'pdfHtml5' : 'pdfFlash' );
				break;
			case 'buttons-print':
				funcName = 'print';
				break;
		}

		var cb = function () {
			button.removeClass( 'processing' );
		};

		if ( !funcName ) {
			cb();
			return;
		}

		dt.one( 'preXhr', function ( e2, s, data ) {
			data.start = 0;
			data.length = TableData.count;

			dt.one( 'preDraw', function ( e3, settings ) {
				DatatableLibrary.buttons[ funcName ].action.call( self, e3, dt, button, config, cb );

				dt.one( 'preXhr', function ( e4, s1, data1 ) {
					// eslint-disable-next-line no-underscore-dangle
					settings._iDisplayStart = oldStart;
					data1.start = oldStart;
				} );

				setTimeout( dt.ajax.reload, 0 );
				return false;
			} );

		} );

		dt.ajax.reload();
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
					console.log( 'result', json );
					// eslint-disable-next-line no-console
					console.log( 'log', log );
				}

				// cache all retrieved rows for each sorting
				// dimension (column/dir), up to a fixed
				// threshold (CacheLimit)
				if ( 'search' in data.datatableData &&
					data.datatableData.search.value === ''
				) {
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
				console.error( 'visualdata-datatables-api', error );
			} );
	};

	var restoreBadge = function () {
		function drawBadge( favicon ) {
			if ( favicon ) {
				favicon.parentNode.removeChild( favicon );
			}
			var newLink = document.createElement( 'link' );
			newLink.href = FaviconHref;
			newLink.rel = 'icon';
			document.head.appendChild( newLink );
		}
		if ( FaviconHref ) {
			var link = document.querySelector( "link[rel~='icon']" );
			drawBadge( link );
		}
	};

	// @credits https://www.sitelint.com/blog/add-a-badge-to-the-browser-tab-favicon-using-javascript
	// @credits https://stackoverflow.com/questions/260857/changing-website-favicon-dynamically
	var addBadge = function () {
		document.head = document.head || document.getElementsByTagName( 'head' )[ 0 ];

		function drawBadge( favicon ) {
			const faviconSize = 32;
			const canvas = document.createElement( 'canvas' );
			canvas.width = faviconSize;
			canvas.height = faviconSize;
			const context = canvas.getContext( '2d' );
			const img = document.createElement( 'img' );

			const createBadge = () => {
				context.drawImage( img, 0, 0, faviconSize, faviconSize );

				context.beginPath();
				context.arc( canvas.width - faviconSize / 6, faviconSize / 6, faviconSize / 6, 0, 2 * Math.PI );
				context.fillStyle = '#e30';
				context.fill();

				if ( favicon ) {
					favicon.parentNode.removeChild( favicon );
				}
				var newIcon = document.createElement( 'link' );
				newIcon.href = canvas.toDataURL( 'image/png' );
				newIcon.rel = 'icon';
				document.head.appendChild( newIcon );
			};

			img.addEventListener( 'load', createBadge );
			img.src = favicon.href;
			FaviconHref = favicon.href;
		}

		var link = document.querySelector( "link[rel~='icon']" );
		drawBadge( link );
	};

	var callApiSynch = function (
		data,
		callback,
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
				var result = res[ payload.action ].result;
				var log = res[ payload.action ].log;

				if ( displayLog ) {
					// eslint-disable-next-line no-console
					console.log( 'result', result );
					// eslint-disable-next-line no-console
					console.log( 'log', log );
				}

				callback( result );
			} )
			.fail( function ( error ) {
				// eslint-disable-next-line no-console
				console.error( 'visualdata-datatables-api-synch', error );
			} );
	};

	function objectValues( obj ) {
		return Object.keys( obj ).map( function ( e ) {
			return obj[ e ];
		} );
	}

	var initColumnSort = function ( order, headers ) {
		var ret = [];
		// eg. new_property asc, new_property_2 desc
		var values = order.split( /\s*,\s*/ );

		// @see QueryProcessor -> getOptions
		for ( var i in values ) {
			var match = values[ i ].match( /^\s*(.+?)\s*(ASC|DESC)?\s*$/i );
			if ( !match ) {
				continue;
			}
			var propName = match[ 1 ];
			var sort = match[ 2 ] ? match[ 2 ] : 'ASC';
			var index = Object.keys( headers ).indexOf( propName );
			if ( index !== -1 ) {
				ret.push( [ index, sort.toLowerCase() ] );
			}
		}
		if ( ret.length > 0 ) {
			Table.data( 'order', ret );
		} else {
			// default @see https://datatables.net/reference/option/order
			Table.data( 'order', [ [ 0, 'asc' ] ] );
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

	// this is used only if Ajax is disabled
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

				for ( var iii in data[ i ][ key ] ) {
					var value = data[ i ][ key ][ iii ];

					if ( value === '' ) {
						if ( !conf.searchPanes.showEmpty ) {
							continue;
						}
					}
					dataLength[ ii ]++;
					var label;
					if ( conf.searchPanes.htmlLabels === false ) {
						div.innerHTML = value;
						label = div.textContent || div.innerText || '';
					} else {
						label = value;
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

					if ( !( value in ret[ key ] ) ) {
						ret[ key ][ value ] = {
							label: label,
							value,
							count: 0
						};
					}

					ret[ key ][ value ].count++;
				}
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
						return (
							objectValues( data[ rowIdx ] )[ i ].indexOf(
								searchPanesOptions[ i ][ ii ].value ) !== -1
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
		conf,
		headersRaw
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
				if ( conf.searchPanes.htmlLabels === false && headersRaw[ i ] ) {
					div.innerHTML = ret[ i ][ ii ].label;
					ret[ i ][ ii ].label = div.textContent || div.innerText || '';
				}

				ret[ i ][ ii ].total = ret[ i ][ ii ].count;
			}
		}

		for ( var i in columnDefs ) {
			if ( 'searchPanes' in columnDefs[ i ] && !( indexFromPrintout( columnDefs[ i ].name ) in ret ) ) {
				delete columnDefs[ i ].searchPanes;
			}
		}

		return ret;
	};

	var renderCards = function ( headers ) {
		if ( Table.hasClass( 'cards' ) ) {
			var labels = VisualDataFunctions.objectValues( headers );

			// Add data-label attribute to each cell
			// (will be used by .visualdata.datatable.cards td:before)
			$( 'tbody tr', Table ).each( function () {
				$( this ).find( 'td' ).each( function ( column ) {
					$( this ).attr( 'data-label', labels[ column ] );
				} );
			} );

			// set same heigth for all cards
			var max = 0;
			$( 'tbody tr', Table ).each( function () {
				max = Math.max( $( this ).height(), max );
			} ).height( max );
		}
	};

	var render = function () {
		var preloadData = {};
		var count = TableData.count;
		var conf = TableData.conf;
		var query = TableData.query;
		var data = TableData.json;
		var params = TableData.params;
		var printouts = TableData.printouts;
		var templates = TableData.templates;
		var mapPathSchema = TableData.mapPathSchema;
		var headers = TableData.headers;
		// var headersRaw = TableData.headersRaw;
		var headersRaw = VisualDataFunctions.objectValues( TableData.headersRaw );
		var printoutsOptions = TableData.printoutsOptions;
		var searchPanesOptions = TableData.searchPanesOptions;
		var useAjax = ( count > data.length );

		var displayLog = params.displayLog;
		if ( displayLog ) {
			// eslint-disable-next-line no-console
			console.log( 'TableData', TableData );
		}
		initColumnSort( query.params.order, headers );
		var order = Table.data( 'order' );

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
		var synch = isObject( conf.synch );

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

						// @see https://datatables.net/reference/option/columns.data
						// @see https://datatables.net/examples/ajax/objects_subarrays.html
						// @see https://datatables.net/extensions/searchpanes/examples/advanced/renderArrays.html
						// data: function ( row, type, val, meta ) {
						// return row[ meta.col ].join( params[ 'values-separator' ] );
						// },

						render: function ( thisData, type, row, meta ) {
						// if ( !headersRaw[ Object.keys( headers )[ meta.col ] ] ) {
							if ( !headersRaw[ meta.col ] ) {
								thisData = thisData.map( function ( value ) {
									return VisualDataFunctions.escapeHTML( value );
								} );
							}
							return thisData.join( params[ 'values-separator' ] );
						},
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

		if ( conf.cards ) {
			conf.responsive = false;
		}

		// *** url params are passed for the use
		// with the template ResultPrinter which
		// may use the "urlget" parser function or similar

		// do not use VisualDataFunctions.objectEntries
		var searchParams = new URLSearchParams( location.search );
		var urlParams = {};
		for ( const [ k, v ] of searchParams ) {
			urlParams[ k ] = v;
		}
		delete urlParams.title;
		delete urlParams.action;

		if ( synch ) {
			var payloadDataSync = {
				synch: true,
				params,
				synchProperty: conf.synch.property,
				query: query.query,
				templates,
				printouts,
				urlParams,
				sourcePage: mw.config.get( 'wgPageName' )
			};

			if ( !Array.isArray( conf.buttons ) ) {
				conf.buttons = [];
			}

			// https://datatables.net/reference/feature/buttons.buttons
			conf.buttons.unshift( {
				text: mw.msg( 'visualdata-jsmodule-datatables-buttons-reload-label' ),
				attr: {
					id: 'visualdata-datatables-buttons-reload',
					style: 'display: none'
				},
				action: function ( e, dt, node, config ) {
					// called from the OOUII button
				}
			} );

			// call each n seconds, if new items
			// exist, show the update button to
			// retrieve again the original query
			SynchInterval = setInterval( function () {
				var callback = function ( result ) {
					// update time
					conf.queryTime = result.queryTime;
					// *** for now we leave it, we retrieve
					// instead the all table
					// $( self ).DataTable( conf ).row.add( json.data ).draw( false );

					if ( result.count > 0 ) {
						clearInterval( SynchInterval );
						addBadge();

						// $( '#visualdata-datatables-buttons-reload' ).show();
						var reloadButton = new OO.ui.ButtonWidget( {
							label: mw.msg( 'visualdata-jsmodule-datatables-buttons-reload-table-label' ),
							// or bell
							icon: 'reload',
							flags: [ 'destructive' ]
						} );

						reloadButton.on( 'click', function () {
							reloadButton.setDisabled( true );
							reloadButton.$element.find( '.oo-ui-iconElement-icon' ).addClass( 'rotating' );

							var thisCallback = function ( thisResult ) {
								reloadButton.$element.find( '.oo-ui-iconElement-icon' ).removeClass( 'rotating' );
								reloadButton.setDisabled( false );
								Datatable.destroy();
								restoreBadge();
								el = $( el ).replaceWithPush( thisResult.data );
								// eslint-disable-next-line no-new
								new VisualDataDatatables( el );
							};
							callApiSynch( $.extend( payloadDataSync, {
								api: false
							} ),
							thisCallback,
							displayLog
							);
						} );

						$( '#visualdata-datatables-buttons-reload' ).replaceWith( reloadButton.$element );
					}
				};
				callApiSynch( $.extend( payloadDataSync, {
					queryTime: conf.queryTime,
					api: true
				} ),
				callback,
				displayLog
				);
			}, conf.synch.interval * 1000 );
		}

		// default layout
		// https://datatables.net/reference/option/layout
		if ( conf.buttons.length &&
			conf.layout.topStart !== 'buttons' &&
			conf.layout.topEnd !== 'buttons' &&
			conf.layout.bottomStart !== 'buttons' &&
			conf.layout.bottomEnd !== 'buttons'
		) {
			conf.layout.top1Start = 'buttons';
		}

		if ( searchPanes ) {
			// https://datatables.net/examples/layout/ids-and-classes.html
			conf.layout.top2 = {
				// whatever class
				rowClass: 'row-class',
				features: 'searchPanes'
			};

			initSearchPanesColumns( columnDefs, conf );

			if ( !useAjax ) {
				searchPanesOptions = getPanesOptions(
					data,
					columnDefs,
					conf
				);
				setPanesOptions(
					data,
					searchPanesOptions,
					columnDefs
				);
			} else {
				searchPanesOptions = searchPanesOptionsServer(
					searchPanesOptions,
					columnDefs,
					conf,
					headersRaw
				);
			}
		}

		conf.columnDefs = columnDefs;

		conf.drawCallback = function ( settings ) {
			if ( conf.cards ) {
				renderCards( headers );
			}
		};

		var extendButtons = function ( obj ) {
			var defaultExtend = function ( name ) {
				return {
					extend: name,
					// @see https://datatables.net/extensions/buttons/examples/print/columns.html
					exportOptions: {
						columns: ':visible'
					}
				};
			};

			for ( var i in conf.buttons ) {
				// @see https://datatables.net/reference/button/?extn=buttons
				switch ( conf.buttons[ i ] ) {
					case 'print':
					case 'pdf':
					case 'excel':
					case 'csv':
					case 'copy':
						conf.buttons[ i ] = $.extend( defaultExtend( conf.buttons[ i ] ), obj );
						break;
				}
			}
		};

		// conf.destroy = true;
		// conf.retrieve = false;
		if ( !useAjax ) {
			conf.serverSide = false;
			conf.data = data;

			extendButtons();

			// use Ajax only when required
		} else {
			// prevents double spinner
			// $(container).find(".datatables-spinner").hide();

			extendButtons( { action: exportAction } );

			var preloadData = {};

			// cache using the column index and sorting
			// method, as pseudo-multidimensional array
			// column index + dir (asc/desc) + searchPanes (empty selection)
			var cacheKey = getCacheKey( {
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
				params,
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
				ajax: function ( datatableData, thisCallback, settings ) {
					// must match initial cacheKey
					var thisCacheKey = getCacheKey( datatableData );

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
						return thisCallback( {
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
					for ( var ii in preloadData ) {
						var totalSize = preloadData[ ii ].data.length;

						if ( totalSize > getCacheLimit() ) {
							// eslint-disable-next-line no-console
							console.log( 'flushing datatables cache!' );
							preloadData[ ii ] = {};
						}
					}
					callApi(
						$.extend( payloadData, {
							datatableData,
							cacheKey: thisCacheKey,
							urlParams,
							api: true
						} ),
						thisCallback,
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

		Datatable = $( el ).DataTable( conf );
	};

	render();
};

$( function () {
	// https://stackoverflow.com/questions/6118778/jquery-replacewith-find-new-element
	$.fn.replaceWithPush = function ( a ) {
		var $a = $( a );
		this.replaceWith( $a );
		return $a;
	};

	var buttons = [];
	$( '.visualdata.datatable' ).each( function () {
		var data = $( this ).data();
		if ( data.conf && ( 'buttons' in data.conf ) && Array.isArray( data.conf.buttons ) ) {
			buttons = buttons.concat( data.conf.buttons );
		}
	} );

	var modules = [];
	if ( buttons.indexOf( 'pdf' ) !== -1 ) {
		modules.push( 'ext.VisualData.Datatables.export.pdf' );
	}

	if ( buttons.indexOf( 'excel' ) !== -1 ) {
		modules.push( 'ext.VisualData.Datatables.export.excel' );
	}

	function initialize() {
		$( '.visualdata.datatable' ).each( function () {
			// eslint-disable-next-line no-new
			new VisualDataDatatables( this );
		} );
	}

	if ( !modules.length ) {
		initialize();
	} else {
		mw.loader.using( modules, function () {
			initialize();
		} );
	}
} );
