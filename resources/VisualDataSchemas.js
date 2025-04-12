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
 * @copyright Copyright ©2023-2024, https://wikisphere.org
 */

/* eslint-disable no-tabs */
/* eslint-disable no-underscore-dangle */

// eslint-disable-next-line no-implicit-globals
VisualDataSchemas = ( function () {
	var Models = [];
	var SelectedItems = [];
	var DataTable;
	var DialogName = 'dialogSchemas';
	var Config;
	var WindowManager;
	var Schemas = {};
	var VisualDataFormFieldInst;
	var VisualDataContentBlockInst;
	var VisualDataGeolocationInst;

	function getModel() {
		return Models[ Models.length - 1 ];
	}

	function getWidgetValue( obj ) {
		var ret = '';
		if ( 'getValue' in obj ) {
			ret = obj.getValue();
			if ( typeof ret === 'string' ) {
				return ret.trim();
			} else if ( Array.isArray( ret ) ) {
				return ret.map( ( x ) => x.trim() );
			}
			return ret;
		}
		return Object.keys( obj )
			.map( ( i ) => {
				return obj[ i ];
			} )
			.map( ( x ) => x.getValue() );
	}

	function getPropertyValue( property, propName, self ) {
		if ( !self ) {
			var self = VisualDataSchemas;
		}
		var model = self.getModel();

		if ( propName ) {
			model = model[ propName ];
		}
		if ( property in model ) {
			return getWidgetValue( model[ property ] );
		}

		var currentItem = self.getCurrentItem();

		if ( !currentItem ) {
			return '';
		}

		// new item
		if ( propName && currentItem.type !== 'array' ) {
			return '';
		}

		if (
			!propName &&
			currentItem.type === 'array' &&
			VisualDataFunctions.isObject( currentItem.items )
		) {
			currentItem = currentItem.items;
		}

		if ( !( 'wiki' in currentItem ) ) {
			// eslint-disable-next-line no-console
			console.error( 'missing "wiki" key' );
			return '';
		}

		if ( property in currentItem.wiki ) {
			return currentItem.wiki[ property ];
		}
		return '';
	}

	function getDatatableId( panel ) {
		return `visualdata-schemas-datatable-dialog-${ SelectedItems.length }-${ panel }`;
	}

	function getCurrentItem() {
		if ( !SelectedItems.length ) {
			return null;
		}
		var ret = SelectedItems[ SelectedItems.length - 1 ];

		if ( ret.type === 'array' && !ret.items ) {
			ret.items = { wiki: {}, properties: {} };
		}

		return ret;
	}

	function orderFields( fields, panel ) {
		if ( !$.fn.DataTable.isDataTable( '#' + getDatatableId( panel ) ) ) {
			return fields;
		}
		var datatable = $( '#' + getDatatableId( panel ) ).DataTable();
		var ret = {};
		// eslint-disable-next-line no-unused-vars, array-callback-return
		datatable.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
			var key = Object.keys( fields )[ rowIdx ];
			if ( key in fields ) {
				ret[ key ] = fields[ key ];
			}
		} );
		var newItems = {};
		for ( var i in fields ) {
			if ( !( i in ret ) ) {
				newItems[ i ] = fields[ i ];
			}
			delete fields[ i ];
		}
		for ( var i in ret ) {
			fields[ i ] = ret[ i ];
		}
		for ( var i in newItems ) {
			fields[ i ] = newItems[ i ];
		}
	}

	function initializeNestedDataTable( panel ) {
		var currentItem = getCurrentItem();

		// array items can share the same schema for
		// all items, or to contain a tuple (to be an
		// array of items of fixed length)
		// in the first case, we consider the schema
		// being the child schema,
		// in the second case being the parent schema
		// (in the first case, we will provide an
		// editable panel with the properties of the
		// parent schema)
		if (
			currentItem.type === 'array' &&
			VisualDataFunctions.isObject( currentItem.items )
		) {
			currentItem = currentItem.items;
		}

		orderFields( currentItem[ panel ], panel );

		VisualDataFunctions.destroyDataTable( getDatatableId( panel ) );

		function getType( thisItem ) {
			var ret;
			switch ( thisItem.wiki.type ) {
				case 'schema':
					ret = mw.msg( 'visualdata-jsmodule-schemas-subitem' );
					break;
				case 'property':
					ret = thisItem.wiki[ 'jsonSchema-type' ] +
						( thisItem.wiki[ 'jsonSchema-type' ] !== 'string' ?
							'' :
							' (' + thisItem.wiki[ 'jsonSchema-format' ] + ')' );

					if ( !( 'preferred-input' in thisItem.wiki ) ) {
						thisItem.wiki[ 'preferred-input' ] =
							VisualDataFunctions.getPreferredInput( thisItem.wiki );
					}
					break;
				case 'content-block':
					ret = mw.msg( 'visualdata-jsmodule-schemas-content-block' );
					break;
				case 'geolocation':
					ret = mw.msg( 'visualdata-jsmodule-schemas-geolocation' );
					break;
			}
			return ret;
		}

		// this returns a modified item, the object schema
		// or the array schema "subject" in case of
		// array, with name of parent schema
		function getItem( thisItem ) {
			var thisItem = VisualDataFunctions.deepCopy( thisItem );
			if ( !( 'wiki' in thisItem ) ) {
				thisItem.wiki = { name: '' };
			}

			// handle from property panel
			// @TODO handle tuple
			if (
				thisItem.type === 'array' &&
				VisualDataFunctions.isObject( thisItem.items ) &&
				thisItem.items.type !== 'array'
			) {
				var ret = thisItem.items;
				ret.wiki.name = thisItem.wiki.name;
				return { item: ret, isArray: true };
			}
			return { item: thisItem, isArray: false };
		}

		var n = 0;
		var data = [];
		var propName = panel;

		for ( var i in currentItem[ propName ] ) {
			var { item, isArray } = getItem( currentItem[ propName ][ i ] );
			var required = '';
			// var input = '';
			var multiple = '';
			if ( item.wiki.type === 'property' ) {
				// input = item.wiki[ 'preferred-input' ];
				required = item.wiki.required ?
					mw.msg( 'visualdata-jsmodule-formfield-required' ) :
					mw.msg( 'visualdata-jsmodule-formfield-not-required' );
			} else {
				required = mw.msg( 'visualdata-jsmodule-formfield-n/a' );
				// input = mw.msg( 'visualdata-jsmodule-formfield-n/a' );
			}
			if ( isArray ) {
				multiple = mw.msg( 'visualdata-jsmodule-schemas-multiple' );
			}
			var type = getType( item );
			data.push( [
				n,
				item.wiki.name,
				type,
				// input
				multiple,
				required,
				''
			] );

			n++;
		}

		if ( !data.length ) {
			return;
		}

		$( '#' + getDatatableId( panel ) ).DataTable( {
			// order: 1,
			// pageLength: 20,
			// https://datatables.net/reference/option/dom
			dom: '<"visualdata-datatable-left"f><"visualdata-datatable-right"l>rtip',

			// @ATTENTION! this conflicts with "rowReorder"
			// use instead an hidden column and set orderable to false
			// for all visible columns
			// ordering: false,

			iDisplayLength: 100,
			searching: false,
			paging: false,
			info: false,
			rowReorder: {
				// update: false,
				// dataSrc: 0,
				selector: 'td:not(:last-child)'
			},
			scrollX: true,
			columnDefs: [
				{ targets: 0, orderable: true, visible: false },
				{ orderable: false, targets: '_all' },
				{
					targets: 5,
					// eslint-disable-next-line no-unused-vars
					render: function ( data_, thisType, row, meta ) {
						return (
							'<span class="buttons-wrapper" style="white-space:nowrap" data-row="' +
							row[ 0 ] +
							'"></span>'
						);
					}
				}
			],

			// lengthMenu: [ 10, 20, 50, 100, 200 ],
			// lengthChange: false,
			data: data,
			// stateSave: true,
			columns: [ '' ].concat(
				mw.msg( 'visualdata-jsmodule-schemas-properties-columns' )
					.split( /\s*,\s*/ )
					.map( function ( x ) {
						return { title: x };
					} )
			)
		} );

		$( '#' + getDatatableId( panel ) + ' .buttons-wrapper' ).each( function () {
			var buttonWidgetEdit = new OO.ui.ButtonWidget( {
				icon: 'edit'
				// flags: ["progressive"],
			} );

			var row = $( this ).data().row;
			var key = Object.keys( currentItem[ propName ] )[ row ];

			// this is the modified item, the object schema
			// or the array schema "subject" in case of
			// array, with name of parent schema

			// eslint-disable-next-line no-unused-vars
			const { item: thisItem, isArray: thisIsArray } = getItem( currentItem[ propName ][ key ] );

			if ( !( 'type' in thisItem.wiki ) ) {
				thisItem.wiki.type = 'property';
			}

			var targetItem =
				currentItem.type !== 'array' ?
					currentItem[ propName ] :
					currentItem.items[ propName ];

			var callback = function () {
				initializeNestedDataTable( panel );
			};

			buttonWidgetEdit.on( 'click', function () {
				// switch by subschema type (if array)
				switch ( thisItem.wiki.type ) {
					case 'property':
						VisualDataFormFieldInst.openDialog( callback, targetItem, key );
						break;

					case 'content-block':
						VisualDataContentBlockInst.openDialog(
							callback,
							targetItem,
							key
						);
						break;

					case 'geolocation':
						VisualDataGeolocationInst.openDialog(
							callback,
							targetItem,
							key
						);
						break;

					case 'schema':
						// pass the child schema, we don't pass the target
						// item since the dialog must handle the parent schema
						// as well (in case of array)
						openDialog( currentItem[ propName ][ key ], propName );
						break;
				}
			} );

			var buttonWidgetDelete = new OO.ui.ButtonWidget( {
				icon: 'close',
				flags: [ 'destructive' ]
			} );

			buttonWidgetDelete.on( 'click', function () {
				VisualDataFunctions.OOUIAlert(
					new OO.ui.HtmlSnippet(
						mw.msg( 'visualdata-jsmodule-schemas-delete-confirm' )
					),
					{ size: 'medium' },
					function () {
						delete currentItem[ propName ][ key ];
						// *** or delete the row manually
						initializeNestedDataTable( panel );
					}
				);
			} );
			$( this ).append( [ buttonWidgetEdit.$element, buttonWidgetDelete.$element ] );
		} );

		// DataTables[DataTables.length - 1].draw();
	}

	function PageTwoLayout( name, config ) {
		PageTwoLayout.super.call( this, name, config );

		this.name = name;

		var toolbar = createToolbarB( name );

		var contentFrame = new OO.ui.PanelLayout( {
			$content: $(
				// display
				'<table id="' +
					getDatatableId( name ) +
					'" class="visualdata-datatable" width="100%"></table>'
			), // this.fieldset.$element,
			expanded: false,
			padded: false,
			classes: [ 'visualdata-schemas-properties-contentframe' ]
		} );

		var frameA = new OO.ui.PanelLayout( {
			$content: [ toolbar.$element, contentFrame.$element ],
			expanded: false,
			// framed: false,
			padded: false,
			data: { name: 'manage-schemas' }
		} );

		this.$element.append( frameA.$element );
	}

	OO.inheritClass( PageTwoLayout, OO.ui.PageLayout );
	PageTwoLayout.prototype.setupOutlineItem = function () {
		this.outlineItem.setLabel(
			// Messages that can be used here:
			// * visualdata-jsmodule-schemas-panel-properties
			// * visualdata-jsmodule-schemas-panel-oneOf
			mw.msg( 'visualdata-jsmodule-schemas-panel-' + this.name )
		);
	};

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
			modes: 'main',
			label: mw.msg( 'visualdata-jsmodule-dialog-delete' ),
			flags: 'destructive'
		},
		{
			action: 'save',
			modes: [ 'main', 'properties' ],
			label: mw.msg( 'visualdata-jsmodule-dialog-save' ),
			flags: [ 'primary', 'progressive' ]
		},
		{
			modes: [ 'main', 'properties' ],
			label: mw.msg( 'visualdata-jsmodule-dialog-cancel' ),
			flags: [ 'safe', 'close' ]
		}
	];

	function DialogContent() {
		var page1 = new PageOneLayout( 'main', {} );

		var page2 = new PageTwoLayout( 'properties', {
			classes: [ 'visualdata-schemas-panel-properties' ]
		} );

		// *** the following requires more brainstorming
		// specifically, anyOf and oneOf are expected to
		// be objects, not properties in the same schema
		// so addField should be disabled in this case
		// or should inherit the current schema ...
		/*
		this.page3 = new PageTwoLayout("anyOf", {
			classes: ["visualdata-schemas-panel-properties"],
		});
		this.page4 = new PageTwoLayout("oneOf", {
			classes: ["visualdata-schemas-panel-properties"],
		});
		// this.page5 = new PageTwoLayout("prefixItems", {
		// 	classes: ["visualdata-schemas-panel-properties"],
		// });
		this.page5 = new PageTwoLayout("allOf", {
			classes: ["visualdata-schemas-panel-properties"],
		});
		this.page6 = new PageTwoLayout("additionalProperties", {
			classes: ["visualdata-schemas-panel-properties"],
		});
		*/

		var booklet = new OO.ui.BookletLayout( {
			outlined: true,
			expanded: true,
			padded: false
		} );

		booklet.addPages( [
			page1,
			page2
			// this.page3,
			// this.page4,
			// this.page5,
			// this.page6,
		] );

		return booklet;
	}

	ProcessDialog.prototype.getSetupProcess = function ( data ) {
		var initPropertiesTab = function ( tabName ) {
			if (
				tabName !== 'page1' &&
				!$.fn.DataTable.isDataTable( '#' + getDatatableId( tabName ) )
			) {
				// $('#visualdata-forms-datatable-dialog').DataTable().clear().draw();
				initializeNestedDataTable( tabName );
			}
		};

		return ProcessDialog.super.prototype.getSetupProcess.call( this, data )
			.next( function () {
				this.actions.setMode( data.initialTab );
				var booklet = DialogContent();
				this.$body.append( booklet.$element );
				booklet.setPage( data.initialTab );

				booklet.on( 'set', function ( value ) {
					initPropertiesTab( value.name );
				} );

				setTimeout( function () {
					initPropertiesTab( data.initialTab );
					VisualDataFunctions.removeNbspFromLayoutHeader(
						'#visualdata-ProcessDialogEditData'
					);
				}, 30 );

			}, this );
	};

	ProcessDialog.prototype.initialize = function () {
		ProcessDialog.super.prototype.initialize.apply( this, arguments );
	};

	ProcessDialog.prototype.getActionProcess = function ( action ) {
		if (
			!action ||
			( action === 'delete' &&
				// eslint-disable-next-line no-alert
				!confirm( mw.msg( 'visualdata-jsmodule-schemas-delete-schema-confirm' ) ) )
		) {
			return ProcessDialog.super.prototype.getActionProcess.call( this, action );
		}

		var currentItem = getCurrentItem();

		var payload = {
			action: 'visualdata-save-schema',
			'dialog-action': action,
			'previous-label': currentItem.wiki.name,
			'source-page': mw.config.get( 'wgPageName' ),
			format: 'json',
			schema: {}
		};
		// https://www.mediawiki.org/wiki/OOUI/Windows/Process_Dialogs#Action_sets
		return ProcessDialog.super.prototype.getActionProcess
			.call( this, action )
			.next( function () {
				switch ( action ) {
					case 'save':
						var obj = { type: 'schema' };
						var model = Models[ 0 ];

						// var propName = currentItem.type === 'array' ? 'items': 'properties'

						for ( var i in model ) {
							obj[ i ] = getPropertyValue( i );
						}

						// @TODO sanitize label

						var alert = null;
						if ( obj.name === '' ) {
							alert = mw.msg( 'visualdata-jsmodule-schemas-alert-noname' );
						} else if ( currentItem.wiki.name === '' && obj.name in Schemas ) {
							alert = mw.msg(
								'visualdata-jsmodule-schemas-alert-existing-schema'
							);
						} else if (
							!Object.keys( currentItem.properties ).length
							//  && !Object.keys(currentItem.allOf).length &&
							// !Object.keys(currentItem.anyOf).length &&
							// !Object.keys(currentItem.oneOf).length
						) {
							alert = mw.msg(
								'visualdata-jsmodule-schemas-alert-no-properties'
							);
						}

						if ( alert ) {
							VisualDataFunctions.OOUIAlert( new OO.ui.HtmlSnippet( alert ), {
								size: 'medium'
							} );

							return ProcessDialog.super.prototype.getActionProcess.call(
								this,
								action
							);
						}

						delete obj.parentSchema;
						payload.schema.wiki = obj;
						payload.schema.type = 'object';

						for ( var panel of [
							'properties'
							// "anyOf",
							// "oneOf",
							// "additionalProperties",
						] ) {
							if ( Object.keys( currentItem[ panel ] ).length ) {
								payload.schema[ panel ] = currentItem[ panel ];
								orderFields( payload.schema[ panel ], panel );
							} else {
								delete payload.schema[ panel ];
							}
						}

					// eslint-disable-next-line no-fallthrough
					case 'delete':
						// console.log("payload", JSON.parse(JSON.stringify(payload)));
						payload.schema = JSON.stringify( payload.schema );

						// return;
						var callApi = function ( postData, resolve, reject ) {
							new mw.Api()
								.postWithToken( 'csrf', postData )
								.done( function ( res ) {
									resolve();
									if ( payload.action in res ) {
										var data = res[ payload.action ];
										if ( 'schemas' in data ) {
											data.schemas = JSON.parse( data.schemas );
										}
										if ( data[ 'result-action' ] === 'error' ) {
											VisualDataFunctions.OOUIAlert(
												new OO.ui.HtmlSnippet( data.error ),
												{
													size: 'medium'
												}
											);
										} else {
											if ( 'jobs-count-warning' in data ) {
												VisualDataFunctions.OOUIAlert(
													mw.msg(
														'visualdata-jsmodule-create-jobs-alert',
														parseInt( data[ 'jobs-count-warning' ] )
													),
													{ size: 'medium' },
													callApi,
													[
														$.extend( postData, {
															'confirm-job-execution': true
														} ),
														resolve,
														reject
													]
												);
											} else {
												if ( parseInt( data[ 'jobs-count' ] ) ) {
													VisualDataFunctions.OOUIAlert(
														mw.msg(
															'visualdata-jsmodule-created-jobs',
															parseInt( data[ 'jobs-count' ] )
														),
														{ size: 'medium' }
													);
												}
												Schemas = VisualData.updateSchemas( data, data[ 'result-action' ] );
												// initialize();
												Models.pop();
												SelectedItems.pop();
												WindowManager.closeActiveWindow();
												initializeDataTable();
											}
										}

									} else {
										VisualDataFunctions.OOUIAlert( 'unknown error', {
											size: 'medium'
										} );
									}
								} )
								.fail( function ( res ) {
									// eslint-disable-next-line no-console
									console.error( 'visualdata-save-schema', res );
									reject( res );
								} );
						};

						return new Promise( ( resolve, reject ) => {
							mw.loader.using( 'mediawiki.api', function () {
								callApi( payload, resolve, reject );
							} );
						} ).catch( ( err ) => {
							VisualDataFunctions.OOUIAlert( `error: ${ err }`, { size: 'medium' } );
						} );
				}
			} ); // .next

		// eslint-disable-next-line no-unreachable
		return ProcessDialog.super.prototype.getActionProcess.call( this, action );
	};

	ProcessDialog.prototype.getTeardownProcess = function ( data ) {
		return ProcessDialog.super.prototype.getTeardownProcess
			.call( this, data )
			.first( function () {
				Models.pop();
				SelectedItems.pop();
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

	function ProcessDialogNested( config ) {
		ProcessDialogNested.super.call( this, config );

		this.data = config.data;
	}
	OO.inheritClass( ProcessDialogNested, OO.ui.ProcessDialog );

	ProcessDialogNested.static.name = DialogName;

	ProcessDialogNested.static.actions = [
		/*
		{
			action: 'delete',
			label: mw.msg( 'visualdata-jsmodule-manageproperties-delete' ),
			flags: 'destructive'
		},
		*/
		{
			action: 'save',
			modes: 'edit',
			label: mw.msg( 'visualdata-jsmodule-dialog-save' ),
			flags: [ 'primary', 'progressive' ]
		},
		{
			modes: 'edit',
			label: mw.msg( 'visualdata-jsmodule-dialog-cancel' ),
			flags: [ 'safe', 'close' ]
		}
	];

	ProcessDialogNested.prototype.initialize = function () {
		ProcessDialogNested.super.prototype.initialize.apply( this, arguments );
		this.page1 = new PageOneLayoutNested( 'page1', {} );
		this.page2 = new PageTwoLayout( 'properties', {
			classes: [ 'visualdata-schemas-panel-properties' ]
		} );
		/*
		this.page3 = new PageTwoLayout("anyOf", {
			classes: ["visualdata-schemas-panel-properties"],
		});
		this.page4 = new PageTwoLayout("oneOf", {
			classes: ["visualdata-schemas-panel-properties"],
		});

		this.page5 = new PageTwoLayout("allOf", {
			classes: ["visualdata-schemas-panel-properties"],
		});
		// this.page5 = new PageTwoLayout("prefixItems", {
		// 	classes: ["visualdata-schemas-panel-properties"],
		// });
		this.page6 = new PageTwoLayout("additionalProperties", {
			classes: ["visualdata-schemas-panel-properties"],
		});
		*/

		var booklet = new OO.ui.BookletLayout( {
			outlined: true,
			expanded: true,
			padded: false
		} );

		booklet.addPages( [
			this.page1,
			this.page2
			// this.page3,
			// this.page4,
			// this.page5,
			// this.page6,
		] );
		booklet.setPage( 'page1' );

		booklet.on( 'set', function ( value ) {
			if (
				value.name !== 'page1' &&
				!$.fn.DataTable.isDataTable( '#' + getDatatableId( value.name ) )
			) {
				// $('#visualdata-forms-datatable-dialog').DataTable().clear().draw();
				initializeNestedDataTable( value.name );
			}
		} );

		this.$body.append( booklet.$element );

		setTimeout( function () {
			VisualDataFunctions.removeNbspFromLayoutHeader(
				'#visualdata-ProcessDialogEditProperties'
			);
		}, 30 );
	};

	function handleSaveArray( currentItem, obj ) {
		var parentSchema = obj.parentSchema;
		delete obj.parentSchema;

		// *** important !! otherwise it will be processed
		// as field by VisualDataSchemaProcessor
		if ( obj[ 'multiple-items' ] ) {
			parentSchema.type = 'schema';
		}

		if (
			( obj[ 'multiple-items' ] && currentItem.type === 'array' ) ||
			( !obj[ 'multiple-items' ] && currentItem.type !== 'array' )
		) {
			if ( obj[ 'multiple-items' ] ) {
				currentItem.wiki = parentSchema;
				currentItem.items = $.extend( currentItem.items, { wiki: obj } );
				return currentItem;
			}

			currentItem.wiki = obj;
			return currentItem;
		}

		// move child to parent
		if ( !obj[ 'multiple-items' ] ) {
			// currentItem.type should be always array
			return $.extend(
				currentItem.type === 'array' ? currentItem.items : currentItem,
				{ wiki: obj }
			);
		}

		// create parent - child
		return {
			type: 'array',
			wiki: parentSchema,
			items: $.extend( currentItem, { wiki: obj } )
		};
	}

	ProcessDialogNested.prototype.getActionProcess = function ( action ) {
		var dialog = this;

		if (
			!action ||
			( action === 'delete' &&
				// eslint-disable-next-line no-alert
				!confirm( mw.msg( 'visualdata-jsmodule-schemas-delete-schema-confirm' ) ) )
		) {
			//	return ProcessDialogNested.super.prototype.getActionProcess.call( this, action );
		}

		var data = this.data;
		var propName = data.propName;

		var currentItem = getCurrentItem();
		var parentSchema = currentItem;
		if (
			currentItem.type === 'array' &&
			VisualDataFunctions.isObject( currentItem.items )
		) {
			currentItem = currentItem.items;
		}

		function getValueRec( thisModel, thisObj ) {
			for ( var i in thisModel ) {
				if ( !( 'getValue' in thisModel[ i ] ) ) {
					getValueRec( thisModel[ i ], ( thisObj[ i ] = {} ) );
				} else {
					thisObj[ i ] = getWidgetValue( thisModel[ i ] );
				}
			}
		}

		switch ( action ) {
			case 'delete':
				if ( parentSchema.wiki.name !== '' ) {
					delete SelectedItems[ SelectedItems.length - 1 ][ propName ][
						parentSchema.wiki.name
					];
				}
				break;

			case 'save':
				var model = Models[ Models.length - 1 ];
				var ParentObj = SelectedItems[ SelectedItems.length - 2 ];

				var obj = { type: 'schema' };
				getValueRec( model, obj );

				var objName = obj[ 'multiple-items' ] ? obj.parentSchema.name : obj.name;

				var target =
					ParentObj.type !== 'array' ?
						ParentObj[ propName ] :
						ParentObj.items[ propName ];

				var alert = null;
				if ( objName === '' ) {
					alert = mw.msg( 'visualdata-jsmodule-schemas-alert-noname' );

					// @see VisualDataFormField
				} else if ( objName !== parentSchema.wiki.name && objName in target ) {
					alert = mw.msg( 'visualdata-jsmodule-schemas-alert-existing-item' );
				} else if (
					!Object.keys( currentItem.properties ).length
					//  && !Object.keys(currentItem.allOf).length &&
					// !Object.keys(currentItem.anyOf).length &&
					// !Object.keys(currentItem.oneOf).length
				) {
					alert = mw.msg( 'visualdata-jsmodule-schemas-alert-no-properties' );
				}

				if ( alert ) {
					VisualDataFunctions.OOUIAlert( new OO.ui.HtmlSnippet( alert ), {
						size: 'medium'
					} );

					return ProcessDialog.super.prototype.getActionProcess.call(
						this,
						action
					);
				}

				VisualDataFunctions.renameObjectKey(
					target,
					parentSchema.wiki.name,
					objName
				);

				var updatedSchema = handleSaveArray( parentSchema, obj );
				updatedSchema.type = !obj[ 'multiple-items' ] ? 'object' : 'array';

				var panels = [
					'properties'
					// "anyOf",
					// "oneOf",
					// "allOf",
					// "additionalProperties",
				];

				var target_ = !obj[ 'multiple-items' ] ?
					updatedSchema :
					updatedSchema.items;

				for ( var panel of panels ) {
					if ( panel in target_ ) {
						orderFields( target_[ panel ], panel );
					}
				}

				target[ objName ] = updatedSchema;
				break;
		}

		return new OO.ui.Process( function () {
			dialog.close( { action: action } );
		} );

		// return ProcessDialogNested.super.prototype.getActionProcess.call( this, action );
	};

	ProcessDialogNested.prototype.getTeardownProcess = function ( data ) {
		var self = this;
		return ProcessDialogNested.super.prototype.getTeardownProcess
			.call( this, data )
			.first( function () {
				Models.pop();
				SelectedItems.pop();
				initializeNestedDataTable( self.data.propName );
				WindowManager.removeActiveWindow();
			}, this );
	};

	/**
	 * Override getBodyHeight to create a tall dialog relative to the screen.
	 *
	 * @return {number} Body height
	 */
	ProcessDialogNested.prototype.getBodyHeight = function () {
		// see here https://www.mediawiki.org/wiki/OOUI/Windows/Process_Dialogs
		// this.page1.content.$element.outerHeight( true );
		return window.innerHeight - 100;
	};

	function PageOneLayout( name, config ) {
		PageOneLayout.super.call( this, name, config );

		var currentItem = getCurrentItem();

		var model = Models[ Models.length - 1 ];

		var fieldset = new OO.ui.FieldsetLayout( {
			label: ''
		} );

		//  || currentItem.wiki.name
		var nameInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'name' )
		} );

		model.name = nameInput;

		var titleInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'title' )
		} );

		model.title = titleInput;

		var descriptionInput = new OO.ui.MultilineTextInputWidget( {
			autosize: true,
			rows: 2,
			value: getPropertyValue( 'description' )
		} );

		model.description = descriptionInput;

		var messageWidget = new OO.ui.MessageWidget( {
			type: 'info',
			label: new OO.ui.HtmlSnippet(
				mw.msg(
					'visualdata-jsmodule-formfield-message-schemapage',
					`${ Config.VisualDataSchemaUrl }${ getPropertyValue( 'name' ) }`
				)
			),
			classes: [ 'VisualDataFormFieldMessage' ]
		} );

		messageWidget.toggle( currentItem.wiki.name !== '' );

		fieldset.addItems( [
			messageWidget,
			new OO.ui.FieldLayout( nameInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-name' ),
				align: 'top'
			} ),

			new OO.ui.FieldLayout( titleInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-title' ),
				help: mw.msg( 'visualdata-jsmodule-schemas-title-help' ),
				align: 'top',
				helpInline: true
			} ),

			new OO.ui.FieldLayout( descriptionInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-description' ),
				help: mw.msg( 'visualdata-jsmodule-schemas-description-help' ),
				helpInline: true,
				align: 'top'
			} )

			// new OO.ui.FieldLayout(collapsibleInput, {
			// 	label: mw.msg("visualdata-jsmodule-schemas-collapsible"),
			// 	align: "top",
			// 	help: mw.msg("visualdata-jsmodule-schemas-collapsible-help"),
			// 	helpInline: true,
			// }),

			// new OO.ui.FieldLayout(collapsedInput, {
			// 	label: mw.msg("visualdata-jsmodule-schemas-collapsed"),
			// 	align: "top",
			// 	help: mw.msg("visualdata-jsmodule-schemas-collapsed-help"),
			// 	helpInline: true,
			// }),
		] );

		this.content = new OO.ui.PanelLayout( {
			$content: fieldset.$element,
			padded: true,
			expanded: false
		} );

		this.$element.append( this.content.$element );
	}

	OO.inheritClass( PageOneLayout, OO.ui.PageLayout );

	PageOneLayout.prototype.setupOutlineItem = function () {
		this.outlineItem.setLabel(
			mw.msg( 'visualdata-jsmodule-dialog-main' )
		);
	};

	function parentSchemaContainer( model, self ) {
		if ( !self ) {
			var self = VisualDataSchemas;
		}
		var layout = new OO.ui.PanelLayout( {
			expanded: false,
			padded: true,
			framed: true,
			classes: []
		} );
		var fieldset = new OO.ui.FieldsetLayout( {
			label: mw.msg( 'visualdata-jsmodule-schemas-container-schema' )
		} );

		layout.$element.append( fieldset.$element );

		var nameInput = new OO.ui.TextInputWidget( {
			value: self.getPropertyValue( 'name', 'parentSchema' )
		} );

		model.name = nameInput;

		var titleInput = new OO.ui.TextInputWidget( {
			value: self.getPropertyValue( 'title', 'parentSchema' )
		} );

		model.title = titleInput;

		var descriptionInput = new OO.ui.MultilineTextInputWidget( {
			autosize: true,
			rows: 2,
			value: self.getPropertyValue( 'description', 'parentSchema' )
		} );

		model.description = descriptionInput;

		// @TODO
		// add:
		// min: number, at least: number
		// layout: section, horizontal, greed
		// collapsible: toggle
		// collasped: toggle
		var minItemsInput = new OO.ui.NumberInputWidget( {
			value: self.getPropertyValue( 'min-items', 'parentSchema' ),
			type: 'number'
		} );
		var maxItemsInput = new OO.ui.NumberInputWidget( {
			value: self.getPropertyValue( 'max-items', 'parentSchema' ),
			type: 'number'
		} );

		model[ 'min-items' ] = minItemsInput;
		model[ 'max-items' ] = maxItemsInput;

		var uniqueItemsInput = new OO.ui.ToggleSwitchWidget( {
			value: self.getPropertyValue( 'unique-items', 'parentSchema' )
		} );

		model[ 'unique-items' ] = uniqueItemsInput;

		var fieldMinItems = new OO.ui.FieldLayout( minItemsInput, {
			label: mw.msg( 'visualdata-jsmodule-schemas-min-items' ),
			align: 'top',
			help: mw.msg( 'visualdata-jsmodule-schemas-min-items-help' ),
			helpInline: true
		} );

		var fieldMaxItems = new OO.ui.FieldLayout( maxItemsInput, {
			label: mw.msg( 'visualdata-jsmodule-schemas-max-items' ),
			align: 'top',
			help: mw.msg( 'visualdata-jsmodule-schemas-max-items-help' ),
			helpInline: true
		} );

		var fieldUniqueItems = new OO.ui.FieldLayout( uniqueItemsInput, {
			label: mw.msg( 'visualdata-jsmodule-schemas-unique-items' ),
			align: 'top',
			help: mw.msg( 'visualdata-jsmodule-schemas-unique-items-help' ),
			helpInline: true
		} );

		var messageWidget = new OO.ui.MessageWidget( {
			type: 'info',
			label: new OO.ui.HtmlSnippet(
				mw.msg(
					'visualdata-jsmodule-schemas-message-container-info'
				)
			),
			classes: [ 'VisualDataFormFieldMessage' ]
		} );

		fieldset.addItems( [
			messageWidget,

			new OO.ui.FieldLayout( nameInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-name' ),
				align: 'top'
			} ),

			new OO.ui.FieldLayout( titleInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-title' ),
				help: mw.msg( 'visualdata-jsmodule-schemas-title-help' ),
				align: 'top',
				helpInline: true
			} ),

			new OO.ui.FieldLayout( descriptionInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-description' ),
				help: mw.msg( 'visualdata-jsmodule-schemas-description-help' ),
				helpInline: true,
				align: 'top'
			} ),
			fieldMinItems,
			fieldMaxItems,
			fieldUniqueItems
		] );

		return layout;
	}

	function PageOneLayoutNested( name, config ) {
		PageOneLayoutNested.super.call( this, name, config );

		var currentItem = getCurrentItem();
		var parentSchema = {};

		// array items can share the same schema for
		// all items, or to contain a tuple (to be an
		// array of items of fixed length)
		// in the first case, we consider the schema
		// being the child schema,
		// in the second case being the parent schema
		// (in the firse case, we will provide an
		// editable panel with the properties of the
		// parent schema)
		if (
			currentItem.type === 'array' &&
			VisualDataFunctions.isObject( currentItem.items )
		) {
			parentSchema = currentItem;
			currentItem = currentItem.items;
		}

		var model = Models[ Models.length - 1 ];

		var fieldset = new OO.ui.FieldsetLayout( {
			label: ''
		} );

		//  || currentItem.wiki.name
		var nameInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'name' )
		} );

		model.name = nameInput;

		var titleInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'title' )
		} );

		model.title = titleInput;

		var descriptionInput = new OO.ui.MultilineTextInputWidget( {
			autosize: true,
			rows: 2,
			value: getPropertyValue( 'description' )
		} );

		model.description = descriptionInput;

		// *** TODO, manage arrays and tuples
		// @see https://json-schema.org/understanding-json-schema/reference/array.html#tuple-validation

		var multipleItemsInputValue =
			getPropertyValue( 'multiple-items' ) || parentSchema.type === 'array';

		var multipleItemsInput = new OO.ui.ToggleSwitchWidget( {
			value: multipleItemsInputValue
		} );

		model[ 'multiple-items' ] = multipleItemsInput;

		var layoutParentSchema = parentSchemaContainer( ( model.parentSchema = {} ) );
		layoutParentSchema.toggle( multipleItemsInputValue );
		nameInput.setDisabled( multipleItemsInputValue );

		multipleItemsInput.on( 'change', function ( enabled ) {
			layoutParentSchema.toggle( enabled );
			nameInput.setDisabled( enabled );
		} );

		// var layout = new OO.ui.HorizontalLayout( {
		// 	items: [ minInstancesInput, maxInstancesInput ]
		// } );

		var layoutInput = new OO.ui.DropdownInputWidget( {
			options: VisualDataFunctions.createDropDownOptions( {
				section: mw.msg( 'visualdata-jsmodule-schemas-layout-section' ),
				horizontal: mw.msg( 'visualdata-jsmodule-schemas-layout-horizontal' )
				// 'grid': mw.msg(
				// 	'visualdata-jsmodule-forms-freetext-showalways'
				// )
			} ),
			value: getPropertyValue( 'layout' ) || 'section'
		} );

		model.layout = layoutInput;

		var visibilityInputValue = getPropertyValue( 'visibility' ) || 'visible';

		var visibilityInput = new OO.ui.DropdownInputWidget( {
			options: VisualDataFunctions.createDropDownOptions( {
				visible: mw.msg( 'visualdata-jsmodule-formfield-visibility-visible' ),
				condition: mw.msg( 'visualdata-jsmodule-formfield-visibility-condition' )
			} ),
			value: visibilityInputValue
		} );

		model.visibility = visibilityInput;

		var items = [
			new OO.ui.FieldLayout( nameInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-name' ),
				align: 'top'
			} ),

			new OO.ui.FieldLayout( titleInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-title' ),
				help: mw.msg( 'visualdata-jsmodule-schemas-title-help' ),
				align: 'top',
				helpInline: true
			} ),

			new OO.ui.FieldLayout( descriptionInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-description' ),
				align: 'top'
			} ),

			new OO.ui.FieldLayout( multipleItemsInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-multiple-items' ),
				align: 'top',
				help: mw.msg( 'visualdata-jsmodule-schemas-multiple-items-help' ),
				// 'Toggle on to allow multiple items', // mw.msg(),
				helpInline: true
			} ),

			layoutParentSchema,

			new OO.ui.FieldLayout( layoutInput, {
				label: mw.msg( 'visualdata-jsmodule-schemas-layout' ),
				align: 'top',
				help: mw.msg( 'visualdata-jsmodule-schemas-layout-help' ),
				helpInline: true
			} ),

			new OO.ui.FieldLayout( visibilityInput, {
				label: mw.msg( 'visualdata-jsmodule-formfield-visibility-label' ),
				help: mw.msg( 'visualdata-jsmodule-formfield-visibility-help' ),
				helpInline: true,
				align: 'top'
			} )
		];

		// ------------------ show-if -----------------

		var ParentObj = SelectedItems[ SelectedItems.length - 2 ].properties;

		var otherFields = Object.keys( ParentObj ).filter( ( x ) => {
			return ( ParentObj[ x ].wiki.type === 'property' &&
				ParentObj[ x ].wiki[ 'multiple-items' ] === false );
		} );

		var showifFieldInput = new OO.ui.DropdownInputWidget( {
			options: VisualDataFunctions.createDropDownOptions( otherFields, { key: 'value' } ),
			value: getPropertyValue( 'showif-field' )
		} );

		var showifConditionInput = new OO.ui.DropdownInputWidget( {
			// @https://github.com/Knowledge-Wiki/SemanticResultFormats/blob/561e5304e17fccc894d7b38ab88a03b75606d6c8/formats/datatables/Api.php
			options: VisualDataFunctions.createDropDownOptions( {
				'=': mw.msg( 'visualdata-jsmodule-formfield-showif-condition-=' ),
				'!=': mw.msg( 'visualdata-jsmodule-formfield-showif-condition-!=' ),
				starts: mw.msg( 'visualdata-jsmodule-formfield-showif-condition-starts' ),
				'!starts': mw.msg( 'visualdata-jsmodule-formfield-showif-condition-!starts' ),
				contains: mw.msg( 'visualdata-jsmodule-formfield-showif-condition-contains' ),
				'!contains': mw.msg( 'visualdata-jsmodule-formfield-showif-condition-!contains' ),
				ends: mw.msg( 'visualdata-jsmodule-formfield-showif-condition-ends' ),
				'!ends': mw.msg( 'visualdata-jsmodule-formfield-showif-condition-!ends' ),
				'!null': mw.msg( 'visualdata-jsmodule-formfield-showif-condition-!null' ),
				regex: mw.msg( 'visualdata-jsmodule-formfield-showif-condition-regex' )
			} ),
			value: getPropertyValue( 'showif-condition' )
		} );

		var showifValueInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'showif-value' )
		} );

		showifConditionInput.on( 'change', function ( value ) {
			showifValueInput.toggle( value !== '!null' );
			updateModelShowif( getPropertyValue( 'visibility' ) === 'condition' );
		} );

		showifValueInput.toggle( getPropertyValue( 'showif-condition' ) !== '!null' );

		var layoutHorizontal = new OO.ui.HorizontalLayout( { items: [
			showifFieldInput,
			showifConditionInput,
			showifValueInput
		] } );

		var showifField = new OO.ui.FieldLayout(
			new OO.ui.Widget( {
				content: [ layoutHorizontal ]
			} ),
			{
				label: mw.msg( 'visualdata-jsmodule-formfield-showif' ),
				help: mw.msg( 'visualdata-jsmodule-formfield-showif-help' ),
				helpInline: true,
				align: 'top'
			}
		);

		items.push( showifField );

		var modelMap = {
			'showif-field': showifFieldInput,
			'showif-condition': showifConditionInput,
			'showif-value': showifValueInput
		};

		function updateModelShowif( thisVisibleItems ) {
			for ( var i in modelMap ) {
				if ( thisVisibleItems ) {
					model[ i ] = modelMap[ i ];
				} else {
					delete model[ i ];
				}
			}
			if ( getPropertyValue( 'showif-condition' ) === '!null' ) {
				delete model[ 'showif-value' ];
			}
		}

		updateModelShowif( visibilityInputValue === 'condition' );
		showifField.toggle( visibilityInputValue === 'condition' );

		function onVisibilityInputChange( value ) {
			showifField.toggle( value === 'condition' );
			updateModelShowif( value === 'condition' );
		}

		visibilityInput.on( 'change', function ( value ) {
			onVisibilityInputChange( value );
		} );

		// ------------------ show-if >>>>>>>>>>>>>>>>>

		fieldset.addItems( items );

		this.content = new OO.ui.PanelLayout( {
			$content: fieldset.$element,
			padded: true,
			expanded: false
		} );

		this.$element.append( this.content.$element );
	}

	OO.inheritClass( PageOneLayoutNested, OO.ui.PageLayout );

	PageOneLayoutNested.prototype.setupOutlineItem = function () {
		this.outlineItem.setLabel(
			mw.msg( 'visualdata-jsmodule-dialog-main' )
		);
	};

	function openDialog( schema, propName, initialTab ) {
		if ( !schema ) {
			SelectedItems.push( {
				properties: {},

				// treat as objects
				// items: {},
				// anyOf: {},
				// oneOf: {},
				// allOf: {},

				// additionalProperties: {},
				wiki: { name: '' }
			} );
		} else {
			SelectedItems.push(
				jQuery.extend(
					{
						properties: {},

						// treat as objects
						// items: {},
						// anyOf: {},
						// oneOf: {},
						// allOf: {},
						// additionalProperties: {},
						wiki: {}
					},
					schema
				)
			);
		}

		Models.push( { parentSchema: {} } );

		// *** place here properties to copy
		// @FIXME with arrays this is mistakenly copying to
		// the child, not the parent schema
		if ( 'uuid' in SelectedItems[ SelectedItems.length - 1 ].wiki ) {
			Models[ Models.length - 1 ].uuid = new VisualDataFunctions.MockupOOUIClass(
				schema.wiki.uuid );
		}

		var processDialog;
		var title;

		if ( !propName ) {
			processDialog = new ProcessDialog( {
				size: 'larger',
				id: 'visualdata-ProcessDialogEditData'
			} );

			title =
				mw.msg(
					// The following messages are used here:
					// * visualdata-jsmodule-schemas-defineschema
					// * visualdata-jsmodule-schemas-defineschema - [name]
					'visualdata-jsmodule-schemas-defineschema'
				) + ( name ? ' - ' + name : '' );
		} else {
			processDialog = new ProcessDialogNested( {
				size: 'larger',
				id: 'visualdata-ProcessDialogEditProperties',
				data: { propName: propName }
			} );

			title =
				mw.msg(
					// The following messages are used here:
					// * visualdata-jsmodule-schemas-defineschema
					// * visualdata-jsmodule-schemas-defineschema - [name]
					'visualdata-jsmodule-schemas-defineschema'
				) + ( name ? ' - ' + name : '' );
		}

		WindowManager.newWindow( processDialog, { title: title, initialTab: initialTab || 'main' } );

		if ( !Config.jsonDiffLibrary && !mw.cookie.get( 'visualdata-check-json-diff-library' ) ) {
			VisualDataFunctions.OOUIAlert( new OO.ui.HtmlSnippet( mw.msg( 'visualdata-jsmodule-missing-json-diff-library' ) ), {
				size: 'medium',
				actions: [ OO.ui.MessageDialog.static.actions[ 0 ] ]
			}, function () {
				// 15 days
				var timeLapse = 15 * 86400;
				mw.cookie.set( 'visualdata-check-json-diff-library', true, {
					path: '/',
					expires: timeLapse
				} );
			} );
		}
	}

	// function escape( s ) {
	// 	return String( s )
	// 		.replace( /&/g, '&amp;' )
	// 		.replace( /</g, '&lt;' )
	// 		.replace( />/g, '&gt;' )
	// 		.replace( /"/g, '&quot;' )
	// 		.replace( /'/g, '&#039;' );
	// }

	function initializeDataTable() {
		VisualDataFunctions.destroyDataTable(
			'visualdata-schemas-datatable'
		);

		var data = [];
		for ( var i in Schemas ) {
			var value = Schemas[ i ];

			// *** or use https://datatables.net/manual/data/renderers#Text-helper
			data.push( [
				i,
				'properties' in value ? Object.keys( value.properties ).join( ', ' ) : ''
			] );
		}

		DataTable = $( '#visualdata-schemas-datatable' ).DataTable( {
			order: 1,
			pageLength: 20,

			// https://datatables.net/reference/option/dom
			dom: '<"visualdata-datatable-left"f><"visualdata-datatable-right"l>rtip',
			lengthMenu: [ 10, 20, 50, 100, 200 ],
			// lengthChange: false,
			data: data,
			stateSave: true,
			columns: mw
				.msg( 'visualdata-jsmodule-schemas-columns' )
				.split( /\s*,\s*/ )
				.map( function ( x ) {
					return { title: x };
				} )
		} );

		DataTable.on( 'click', 'tr', function () {
			var index = DataTable.row( this ).index();
			if ( index !== undefined ) {
				var label = data[ index ][ 0 ];
				openSchemaDialog( label, false );
			}
		} );
	}

	function openSchemaDialog( label, initialTab ) {
		if ( !Object.keys( Schemas[ label ] ).length ) {
			VisualData.loadSchemas( [ label ] ).then( function ( schemas ) {
				for ( var i in schemas ) {
					Schemas[ i ] = schemas[ i ];
				}
				openDialog( Schemas[ label ], null, initialTab );
			} );
		} else {
			openDialog( Schemas[ label ], null, initialTab );
		}
	}

	function createToolbarB( panelName ) {
		var toolFactory = new OO.ui.ToolFactory();
		var toolGroupFactory = new OO.ui.ToolGroupFactory();

		var toolbar = new OO.ui.Toolbar( toolFactory, toolGroupFactory, {
			actions: true
		} );

		var currentItem = getCurrentItem();
		// var propName = currentItem.type === "array" ? "items" : panelName;
		var propName = panelName;

		var onSelect = function () {
			var toolName = this.getName();

			var callback = function () {
				initializeNestedDataTable( panelName );
			};
			switch ( toolName ) {
				case 'add-geolocation':
					VisualDataGeolocationInst.openDialog(
						callback,
						currentItem.type !== 'array' ?
							currentItem[ propName ] :
							currentItem.items[ propName ]
					);
					break;
				case 'add-block-content':
					VisualDataContentBlockInst.openDialog(
						callback,
						currentItem.type !== 'array' ?
							currentItem[ propName ] :
							currentItem.items[ propName ]
					);
					break;

				case 'add-field':
					VisualDataFormFieldInst.openDialog(
						callback,
						currentItem.type !== 'array' ?
							currentItem[ propName ] :
							currentItem.items[ propName ]
					);
					break;

				case 'add-subitem':
					openDialog( null, propName );
					break;
			}

			this.setActive( false );
		};

		var toolGroup = [
			{
				name: 'add-field',
				icon: 'add',
				title: mw.msg( 'visualdata-jsmodule-schemas-add-field' ),
				onSelect: onSelect
			},
			{
				name: 'add-block-content',
				icon: 'add',
				title: mw.msg( 'visualdata-jsmodule-schemas-add-block-content' ),
				onSelect: onSelect
			},
			{
				name: 'add-subitem',
				icon: 'add',
				title: mw.msg( 'visualdata-jsmodule-schemas-add-subitem' ),
				onSelect: onSelect
			},
			{
				name: 'add-geolocation',
				icon: 'add',
				title: mw.msg( 'visualdata-jsmodule-schemas-add-geolocation' ),
				onSelect: onSelect
			}
		];
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

	function createToolbarA() {
		var toolFactory = new OO.ui.ToolFactory();
		var toolGroupFactory = new OO.ui.ToolGroupFactory();

		var toolbar = new OO.ui.Toolbar( toolFactory, toolGroupFactory, {
			actions: true
		} );

		var onSelect = function () {
			var toolName = this.getName();

			switch ( toolName ) {
				case 'createschema':
					openDialog( null, null );
					break;
			}

			this.setActive( false );
		};

		var toolGroup = [
			{
				name: 'createschema',
				icon: 'add',
				title: mw.msg( 'visualdata-jsmodule-schemas-create-schema' ),
				onSelect: onSelect
			}
		];
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

	function initialize() {
		if ( Config.context === 'ManageSchemas' ) {
			$( '#schemas-wrapper' ).empty();

			var contentFrame = new OO.ui.PanelLayout( {
				$content: $(
					'<table id="visualdata-schemas-datatable" class="visualdata-datatable display" width="100%"></table>'
				),
				expanded: false,
				padded: true
			} );

			var toolbar = createToolbarA();

			var frame = new OO.ui.PanelLayout( {
				$content: [ toolbar.$element, contentFrame.$element ],
				expanded: false,
				framed: true,
				data: { name: 'manage-schemas' }
			} );

			$( '#schemas-wrapper' ).append( frame.$element );

			toolbar.initialize();
			toolbar.emit( 'updateState' );
		}

		initializeDataTable();
	}

	function setVars( config, windowManager, schemas ) {
		Config = config;
		WindowManager = windowManager;
		Schemas = schemas;

		VisualDataFormFieldInst = new VisualDataFormField(
			config,
			windowManager,
			Schemas
		);
		VisualDataContentBlockInst = new VisualDataContentBlock(
			config,
			windowManager
		);
		VisualDataGeolocationInst = new VisualDataGeolocation(
			config,
			windowManager
		);
	}

	return {
		initialize,
		createToolbarA,
		openDialog,
		parentSchemaContainer,
		getPropertyValue,
		getCurrentItem,
		getModel,
		handleSaveArray,
		getWidgetValue,
		openSchemaDialog,
		setVars
	};
}() );

$( function () {
	var config = JSON.parse( mw.config.get( 'visualdata-config' ) );
	// console.log("config", config);

	if ( config.context === 'ManageSchemas' ) {
		var schemas = JSON.parse( mw.config.get( 'visualdata-schemas' ) );
		// console.log("schemas", schemas);

		var windowManager = new VisualDataWindowManager();
		var instances = [];
		VisualData.setVars( config, schemas, instances );

		VisualDataSchemas.setVars(
			config,
			windowManager,
			schemas,
			instances
		);

		VisualDataSchemas.initialize();
	}

} );
