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
VisualDataFunctions = ( function () {
	/*
		AVAILABLE INPUTS ...
		"OO.ui.TextInputWidget",
		"OO.ui.TagMultiselectWidget",
		"OO.ui.ToggleSwitchWidget",
		"OO.ui.RadioSelectWidget",
		"OO.ui.NumberInputWidget",
		"OO.ui.ComboBoxInputWidget",
		"OO.ui.MultilineTextInputWidget",
		"OO.ui.MultiselectWidget",
		"OO.ui.ButtonSelectWidget",
		"OO.ui.CheckboxMultiselectInputWidget",
		"OO.ui.DropdownInputWidget",
		"mw.widgets.DateInputWidget",
		"mw.widgets.datetime.DateTimeInputWidget",
		"mw.widgets.CategoryMultiselectWidget",
		"mw.widgets.TitleInputWidget",
		"mw.widgets.TitlesMultiselectWidget",
		"mw.widgets.UserInputWidget",
		"mw.widgets.UsersMultiselectWidget",
		'ButtonMultiselectWidget',
		'OO.ui.MenuTagMultiselectWidget',
		'intl-tel-input',
		'RatingWidget',
		MenuTagSearchMultiselect,
		VisualDataVisualEditor

		// @TODO add editor
		// @see PageForms-5.5.1/includes/forminputs/PF_TextAreaInput.php
		// libs/PF_wikieditor.js
*/

	var labelFormulaInputs = [
		'OO.ui.DropdownInputWidget',
		'OO.ui.MenuTagMultiselectWidget',
		'ButtonMultiselectWidget',
		'OO.ui.RadioSelectInputWidget',
		'OO.ui.CheckboxMultiselectInputWidget',
		'MenuTagSearchMultiselect'
	];

	var optionsInputs = [
		'OO.ui.DropdownInputWidget',
		'OO.ui.ComboBoxInputWidget',
		'OO.ui.MenuTagMultiselectWidget',
		'ButtonMultiselectWidget',

		// should also be in the list ? https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.ButtonSelectWidget
		// "OO.ui.ButtonSelectWidget"
		'OO.ui.RadioSelectInputWidget',
		'OO.ui.CheckboxMultiselectInputWidget'
	];

	// var multiselectInputs = [
	// 	'OO.ui.TagMultiselectWidget',
	// 	'ButtonMultiselectWidget',
	// 	'mw.widgets.TitlesMultiselectWidget',
	// 	'mw.widgets.UsersMultiselectWidget',
	// 	'mw.widgets.CategoryMultiselectWidget'
	// ];

	var lookupInputs = [ 'LookupElement', 'MenuTagSearchMultiselect' ];

	function isPromise( value ) {
		return isObject( value ) && 'then' in value;
	}

	function castType( value, type ) {
		// we cannot use this solution othwerwise
		// we cannot validate data
		// if ( isPromise( value ) ) {
		// 	return value;
		// }
		switch ( type ) {
			case 'string':
				value = String( value || '' );
				break;
			case 'number':
				value = Number( value );
				break;
			case 'integer':
				value = parseInt( value );
				break;

			case 'boolean':
				if ( typeof value === 'string' ) {
					value = [ 'true', 't', '1', 'on', 'yes', 'y' ].indexOf( value ) !== -1;
				} else {
					value = !!value;
				}
				break;
		}

		return value;
	}

	function inputNameFromLabel( inputName ) {
		var ret = inputName;
		var parts = ret.split( ' ' );
		if ( parts.length > 1 ) {
			// eslint-disable-next-line no-useless-escape
			ret = parts[ 0 ] + '.' + parts.pop().replace( /[\(\)]/g, '' );
		}
		return ret;
	}

	function getAvailableInputs( type, format, config ) {
		var ret = [];

		// the value in parentheses is parsed by inputNameFromLabel
		// only the last segement after the space is parsed, month)
		switch ( type ) {
			case 'string':
				switch ( format ) {
					case 'color':
						ret = [
							'OO.ui.TextInputWidget (color)',
							'OO.ui.TagMultiselectWidget',
							'LookupElement',
							'MenuTagSearchMultiselect'
						];
						break;
					case 'date':
						ret = [
							'mw.widgets.DateInputWidget',
							'OO.ui.TagMultiselectWidget',
							'LookupElement',
							'MenuTagSearchMultiselect'
						];
						break;
					case 'datetime':
						ret = [ 'mw.widgets.datetime.DateTimeInputWidget' ];
						break;
					case 'datetime-local':
						ret = [ 'mw.widgets.datetime.DateTimeInputWidget' ];
						break;
					case 'email':
						ret = [
							'OO.ui.TextInputWidget (email)',
							'OO.ui.TagMultiselectWidget',
							'LookupElement',
							'MenuTagSearchMultiselect'
						];
						break;
					case 'month':
						// the value in parentheses is parsed by inputNameFromLabel
						// only the last segement after the space is parsed, month)
						ret = [ 'mw.widgets.DateInputWidget (precision month)' ];
						break;
					case 'password':
						ret = [ 'OO.ui.TextInputWidget (password)' ];
						break;
					case 'number':
						ret = [
							'OO.ui.NumberInputWidget',
							'OO.ui.TextInputWidget (number)',
							'RatingWidget',
							'OO.ui.TagMultiselectWidget',
							'LookupElement',
							'MenuTagSearchMultiselect'
						];
						break;
					case 'range':
						// @TODO add range input
						ret = [ 'OO.ui.TextInputWidget' ];
						break;
					case 'tel':
						ret = [
							'intl-tel-input',
							'OO.ui.TextInputWidget (tel)',
							'OO.ui.TagMultiselectWidget',
							'LookupElement',
							'MenuTagSearchMultiselect'
						];
						break;
					case 'text':
						ret = [
							'OO.ui.TextInputWidget',
							'OO.ui.TagMultiselectWidget',
							'OO.ui.MultilineTextInputWidget',
							'LookupElement',
							'MenuTagSearchMultiselect',
							'mw.widgets.TitlesMultiselectWidget',
							'mw.widgets.TitleInputWidget',
							'mw.widgets.UsersMultiselectWidget',
							'mw.widgets.UserInputWidget',
							'OO.ui.SelectFileWidget',
							'mw.widgets.CategoryMultiselectWidget'
						];
						break;
					case 'textarea':
						ret = [ 'OO.ui.MultilineTextInputWidget' ];
						// @TODO uncomment when ready to be used
						// in form inputs
						if ( config.VEForAll ) {
							ret.push( 'VisualEditor' );
						}
						ret.push( 'TinyMCE' );
						return ret;
					case 'time':
						ret = [ 'mw.widgets.datetime.DateTimeInputWidget' ];
						break;
					case 'url':
						ret = [
							'OO.ui.TextInputWidget (url)',
							'OO.ui.TagMultiselectWidget',
							'LookupElement',
							'MenuTagSearchMultiselect'
						];
						break;
					case 'week':
						// should be in the form 04,2025
						ret = [
							// not supported
							// 'mw.widgets.DateInputWidget (precision week)',
							'OO.ui.TextInputWidget',
							'LookupElement',
							'MenuTagSearchMultiselect'
						];
						break;
				}
				break;

			case 'number':
			case 'integer':
				ret = [
					'OO.ui.NumberInputWidget',
					'OO.ui.TextInputWidget (number)',
					'RatingWidget'
				];

				break;
			case 'boolean':
				ret = [ 'OO.ui.ToggleSwitchWidget' ];
				break;

			// select rather a type and toggle "multiple values"
			case 'array':
				break;
		}

		var filterType = [ 'boolean' ];
		var filterFormat = [ 'password' ];
		if (
			!inArray( type, filterType ) &&
			( type !== 'string' || !inArray( format, filterFormat ) )
		) {
			ret = ret.concat( optionsInputs );
		}

		return ret;
	}

	function getInputHelpUrl( inputName ) {
		// @FIXME the resource loader won't load correctly this function
		// without the next line
		// eslint-disable-next-line no-console
		console.log( '' );

		// @TODO redirect to the extension page for docs on specific inputs
		if ( inputName.indexOf( 'OO.' ) === -1 && inputName.indexOf( 'mw.' ) === -1 ) {
			return null;
		}
		// or `https://doc.wikimedia.org/oojs-ui/master/js/${inputName}.html`
		return `https://doc.wikimedia.org/mediawiki-core/1.39.5/js/#!/api/${ inputName }`;
	}

	function isMultiselect( inputName ) {
		// return inArray(inputName, ManageProperties.multiselectInputs))
		return inputName.indexOf( 'Multiselect' ) !== -1;
	}

	function inputInstanceFromName( inputName, config ) {
		var arr = inputName.split( '.' );
		var constructor = null;
		var tags = [];

		// *** we cannot use the native
		// required validation since a schema tab
		// could be hidden, a solution could be
		// to apply the required attribute dynamically
		// and to toggle tab/schema visibility
		// on form submission, however this may
		// be not necessary (a similar solution
		// is used in CIForms to handle native
		// validation with steps) @see https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/extensions/CIForms/+/cda22fd8bb664beeee7fdac97aba9b2c5dbcf730/resources/validation.js
		var required = config.required;
		if ( required ) {
			config.indicator = 'required';
			config.required = false;
		}

		if ( isMultiselect( inputName ) && !( 'selected' in config ) && config.value ) {
			config.selected = ( Array.isArray( config.value ) ? config.value : [ config.value ] );
		}

		switch ( inputName ) {
			case 'OO.ui.DropdownInputWidget':
				if ( config.value ) {
					if ( !config.options ) {
						config.options = [];
					}
					var found = false;
					for ( var val of config.options ) {
						if ( val.data === config.value ) {
							found = true;
							break;
						}
					}
					if ( !found ) {
						config.options.push( {
							data: config.value,
							label: config.value
						} );
					}
				}
				break;
			case 'OO.ui.NumberInputWidget':
				if ( !( 'type' in config ) ) {
					config.type = 'number';
				}
				break;
			case 'mw.widgets.datetime.DateTimeInputWidget':
				// this is a wrapper to parse non-UTC dates
				constructor = VisualDataDateTimeInputWidget;
				break;
			case 'intl-tel-input':
				constructor = VisualDataIntlTelInput;
				break;
			case 'ButtonMultiselectWidget':
				constructor = VisualDataButtonMultiselectWidget;
				break;
			case 'LookupElement':
				constructor = VisualDataLookupElement;
				break;
			case 'MenuTagSearchMultiselect':
				constructor = VisualDataMenuTagSearchMultiselect;
				break;
			case 'RatingWidget':
				constructor = VisualDataRatingWidget;
				break;
			case 'VisualEditor':
				constructor = VisualDataVisualEditor;
				break;
			case 'TinyMCE':
				constructor = VisualDataTinyMCE;
				break;
			case 'mw.widgets.CategoryMultiselectWidget':
				// ***prevents error "Cannot read properties of undefined (reading 'apiUrl')"
				tags = config.selected;
				delete config.selected;
				delete config.value;
				break;
			case 'OO.ui.SelectFileWidget':
				// prevents error "Failed to set the 'value' property on 'HTMLInputElement':
				// This input element accepts a filename, which may only be programmatically
				// set to the empty string"
				delete config.value;
				// *** we handle the filename with a custom
				// implemention
				config.buttonOnly = true;
				if ( !( 'showDropTarget' in config ) || config.showDropTarget !== true ) {
					config.button = {
						flags: [ 'progressive' ],
						icon: 'upload',
						// classes: [ 'visualdata-SelectFileWidget-button' ],
						label: mw.msg( 'visualdata-jsmodule-forms-upload' )
					};
				}
				break;

			case 'OO.ui.MultilineTextInputWidget':
				if ( !( 'autosize' in config ) ) {
					config.autosize = true;
				}
				if ( !( 'rows' in config ) ) {
					config.rows = 2;
				}
				break;

			case 'OO.ui.TagMultiselectWidget':
				if ( !( 'allowArbitrary' in config ) ) {
					config.allowArbitrary = true;
				}
				break;

			default:
				// @TODO find a better solution
				if ( arr.length === 4 ) {
					var value = arr.pop();
					switch ( arr[ 2 ] ) {
						case 'TitleInputWidget':
						case 'TitlesMultiselectWidget':
							config.namespace = parseInt(
								VisualDataFunctions.getKeyByValue(
									mw.config.get( 'wgFormattedNamespaces' ),
									value
								)
							);
							break;
						case 'TextInputWidget':
							if ( !( 'type' in config ) ) {
								config.type = value;
							}
							break;
						case 'DateInputWidget':
							if ( !( 'precision' in config ) ) {
								config.precision = value;
							}
							break;
					}
				}
		}

		if ( !constructor ) {
			constructor =
				inputName.indexOf( 'OO.ui' ) === 0 ? OO.ui[ arr[ 2 ] ] : mw.widgets[ arr[ 2 ] ];
		}

		// fallback
		if ( typeof constructor !== 'function' ) {
			return new OO.ui.TextInputWidget( config );
		}

		if ( inputName === 'OO.ui.HiddenInputWidget' ) {
			constructor.prototype.getValue = function () {
				// @see https://doc.wikimedia.org/mediawiki-core/1.39.5/js/source/oojs-ui-core.html#OO-ui-HiddenInputWidget
				return this.$element.val();
			};
			constructor.prototype.setValue = function ( thisValue ) {
				this.$element.attr( 'value', thisValue );
			};
		}
		// var widget = new constructor( config );
		var widget = addRequiredMixin( constructor, config, required );

		if ( Array.isArray( tags ) ) {
			for ( var value of tags ) {
				widget.addTag( value );
			}
		}

		return widget;
	}

	function addRequiredMixin( constructor, config, required ) {
		if ( !required ) {
			return new constructor( config );
		}
		var Input = function ( configInput ) {
			Input.super.call(
				this,
				jQuery.extend( configInput, { indicator: 'required' } )
			);
			this.constructorName = constructor.name;
		};

		OO.inheritClass( Input, constructor );
		OO.mixinClass( Input, OO.ui.mixin.IndicatorElement );

		return new Input( config );
	}

	function getPreferredInput( schema ) {
		if ( !( 'wiki' in schema ) ) {
			schema.wiki = {};
		}

		if ( 'preferred-input' in schema.wiki ) {
			return schema.wiki[ 'preferred-input' ];
		}

		if ( 'type' in schema && schema.type !== '' ) {
			return getAvailableInput( schema.type, schema.format || null )[ 0 ];
		}

		// fall-back
		return 'OO.ui.TextInputWidget';
	}

	function inArray( val, arr ) {
		return arr.indexOf( val ) !== -1;
	}

	function getKeyByValue( obj, value ) {
		return Object.keys( obj ).find( ( key ) => obj[ key ] === value );
	}

	function sortObjectByKeys( object ) {
		var ret = {};
		Object.keys( object )
			.sort()
			.forEach( function ( key ) {
				ret[ key ] = object[ key ];
			} );
		return ret;
	}

	function renameObjectKey( obj, oldKey, newKey ) {
		// delete jQuery.extend( o, { [ newKey ]: o[ oldKey ] } )[ oldKey ];
		// var keys = Object.keys( obj );
		// var res = keys.reduce( ( acc, key ) => {
		// 	var value = obj[ key ];
		// 	if ( key === oldKey ) {
		// 		key = newKey;
		// 	}
		// 	acc[ key ] = value;
		// 	return acc;
		// }, {} );
		var ret = {};
		for ( var i in obj ) {
			var k = i !== oldKey ? i : newKey;
			ret[ k ] = obj[ i ];
			delete obj[ i ];
		}
		for ( var i in ret ) {
			obj[ i ] = ret[ i ];
		}
	}

	function createTool( obj, config ) {
		var Tool = function () {
			// Tool.super.apply( this, arguments );
			Tool.super.call( this, arguments[ 0 ], config );

			OO.ui.mixin.PendingElement.call( this, {} );

			if ( getNestedProp( [ 'data', 'disabled' ], config ) ) {
				// this.setPendingElement(this.$element)
				// this.pushPending();
				this.setDisabled( true );
			}

			if ( getNestedProp( [ 'data', 'pending' ], config ) ) {
				// this.setPendingElement(this.$element)
				this.pushPending();
			}

			// @see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/c2805c7e9e83e2f3a857451d46c80231d1658a0f/demos/pages/toolbars.js
			this.toggled = false;
			if ( config.init ) {
				config.init.call( this );
			}
		};

		OO.inheritClass( Tool, OO.ui.Tool );
		OO.mixinClass( Tool, OO.ui.mixin.PendingElement );

		Tool.prototype.onSelect = function () {
			if ( obj.onSelect ) {
				obj.onSelect.call( this );
			} else {
				this.toggled = !this.toggled;
				this.setActive( this.toggled );
			}
			// Tool.emit( 'updateState' );
		};

		Tool.prototype.onUpdateState = function () {
			this.popPending();
			this.setDisabled( false );
		};

		/*
		Tool.static.group = group;
		Tool.static.name = name;
		Tool.static.icon = icon;
		Tool.static.title = title;
		Tool.static.flags = flags;
		// Tool.static.classes = ['oo-ui-actionWidget'];
		Tool.static.narrowConfig = narrowConfig;
		Tool.static.displayBothIconAndLabel = true; // !!displayBothIconAndLabel;
*/

		for ( var i in obj ) {
			Tool.static[ i ] = obj[ i ];
		}

		Tool.static.displayBothIconAndLabel = true;

		return Tool;
	}

	function createToolGroup( toolFactory, groupName, tools ) {
		tools.forEach( function ( tool ) {
			var obj = jQuery.extend( {}, tool );
			obj.group = groupName;
			var config = tool.config ? tool.config : {};
			delete obj.config;
			toolFactory.register( createTool( obj, config ) );
		} );
	}

	function createDisabledToolGroup( toolGroupFactory, parent, name ) {
		var DisabledToolGroup = function () {
			DisabledToolGroup.super.call( this, parent, name );
			this.setDisabled( true );
		};
		OO.inheritClass( DisabledToolGroup, parent );
		DisabledToolGroup.static.name = name;
		DisabledToolGroup.prototype.onUpdateState = function () {
			this.setLabel( 'Disabled' );
		};
		toolGroupFactory.register( DisabledToolGroup );
	}

	function createWindowManager() {
		var windowManager = new OO.ui.WindowManager( {
			classes: [ 'visualdata-ooui-window' ]
		} );
		$( document.body ).append( windowManager.$element );

		return windowManager;
	}

	// ***remove annoying &nbsp; on OOUI / Mediawiki 1.39 (~v0.44.3)
	// see vendor/oojs/oojs-ui/php/layouts/FieldsetLayout.php
	function removeNbspFromLayoutHeader( selector ) {
		$( selector + ' .oo-ui-fieldLayout-header' ).each( function () {
			var html = $( this ).html();
			if ( /<label [^>]+>&nbsp;<\/label>/.test( html ) ) {
				$( this ).html( '' );
			}
		} );
	}

	function destroyDataTable( id ) {
		if ( !$.fn.dataTable.isDataTable( '#' + id ) ) {
			return;
		}
		var table = $( '#' + id ).DataTable();

		// *** necessary, othwerwise dataTable.on("click", "tr"
		// gets called 2 times, and openDialog() will create 2 dialogs
		table.off( 'click' );

		table.destroy();
		$( '#' + id ).empty();
	}

	// @credits https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
	function getNestedProp( path, obj ) {
		return path.reduce( ( xs, x ) => ( xs && xs[ x ] ? xs[ x ] : null ), obj );
	}

	function deepCopy( obj ) {
		const seen = new WeakSet();
		return JSON.parse( JSON.stringify( obj, ( key, value ) => {
			if ( typeof value === 'object' && value !== null ) {
				if ( seen.has( value ) ) {
					return '[Circular]';
				}
				seen.add( value );
			}
			return value;
		} ) );
	}

	function nonEnumerableProperty( obj, prop, value ) {
		Object.defineProperty( obj, prop, {
			get() {
				return value;
			},
			enumerable: false
		} );
	}

	function isObject( obj ) {
		return obj !== null && typeof obj === 'object' && !Array.isArray( obj );
	}

	// https://stackoverflow.com/questions/5072136/javascript-filter-for-objects
	function filterObject( obj, predicate ) {
		return (
			Object.keys( obj )
				.filter( ( key ) => predicate( obj[ key ] ) )
				// eslint-disable-next-line no-sequences
				.reduce( ( res, key ) => ( ( res[ key ] = obj[ key ] ), res ), {} )
		);
	}

	function OOUIAlert( text, options, callback, args ) {
		var windowManager = createWindowManager();
		windowManager.addWindows( [ new OO.ui.MessageDialog() ] );

		var obj = { message: text };

		if ( !callback ) {
			obj.actions = [ OO.ui.MessageDialog.static.actions[ 0 ] ];
		}

		// @TODO or return promise
		return windowManager
			.openWindow( 'message', $.extend( obj, options ) )
			.closed.then( function ( action ) {
				return action.action === 'accept' && callback ?
					callback.apply( this, args ) :
					undefined;
			} );
	}

	function decodeHTMLEntities( text ) {
		var el = document.createElement( 'textarea' );
		el.innerHTML = text;
		return el.childNodes.length === 0 ? '' : el.childNodes[ 0 ].nodeValue;
	}

	function createNewKey( obj, msg ) {
		var n = 0;
		var msg = msg.replace( / /g, '_' ).toLowerCase();
		do {
			var str = msg;
			if ( n > 0 ) {
				str = str + '_' + n;
			}
			n++;
		} while ( str in obj );

		return str;
	}

	function createNewLabel( obj, msg ) {
		var n = 0;
		do {
			var label = msg;
			if ( n > 0 ) {
				label = label + ' (' + n + ')';
			}
			n++;
		} while ( label in obj );

		return label;
	}

	function MockupOOUIClass( value ) {
		var Value = value;
		function getValue() {
			return Value;
		}
		function setValue( val ) {
			Value = val;
		}
		return {
			getValue,
			setValue
		};
	}

	function createDropDownOptions( obj, config ) {
		var config = jQuery.extend( { key: 'key', value: 'value' }, config || {} );
		var ret = [];
		for ( var i in obj ) {
			var label = config.value === 'value' ? obj[ i ] : i;
			var key = config.key === 'key' ? i : obj[ i ];
			if ( key === '' ) {
				// zero width space
				label = '​';
			}
			ret.push( {
				data: key,
				label: label
			} );
		}
		return ret;
	}

	function waitUntil( callbackCond, callback, callbackMaxAttempts, maxAttempts ) {
		return new Promise( ( resolve, reject ) => {
			function init( n ) {
				if ( callbackCond() ) {
					callback( resolve, reject );
				} else {
					if ( n <= maxAttempts ) {
						setTimeout( function () {
							init( ++n );
						}, 50 );
					} else if ( callbackMaxAttempts ) {
						callbackMaxAttempts( resolve, reject );
					} else {
						reject();
					}
				}
			}
			init( 0 );
		} );
	}

	// @ref https://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
	function executeFunctionByName( functionName, context, args ) {
		var namespaces = functionName.split( '.' );

		var func = namespaces.pop();
		for ( var i = 0; i < namespaces.length; i++ ) {
			if ( ( namespaces[ i ] in context ) ) {
				context = context[ namespaces[ i ] ];
			}
		}

		if ( !( func in context ) ) {
			// eslint-disable-next-line no-console
			console.error( 'executeFunctionByName function not defined', namespaces );
			return;
		}

		return context[ func ].apply( context, args );
	}

	function loadScripts( scripts, onload ) {
		function loadScript( src, load ) {
			let script = document.createElement( 'script' );
			// eslint-disable-next-line no-unused-vars
			script.onload = load ? onload : function ( e ) {
				// console.log( e.target.src + ' loaded' );
			};
			script.src = src;
			script.async = false;
			document.head.appendChild( script );
		}

		for ( var i in scripts ) {
			loadScript( scripts[ i ], parseInt( i ) === scripts.length - 1 );
		}
	}

	function isNaN( value ) {
		// eslint-disable-next-line no-self-compare
		return typeof value === 'number' && value !== value;
	}

	function escapeJsonPointer( str ) {
		return str.replace( /~/g, '~0' ).replace( /\//g, '~1' );
	}

	function objectEntries( obj ) {
		var keys = Object.keys( obj ),
			i = keys.length,
			ret = new Array( i );
		while ( i-- ) {
			ret[ i ] = [ keys[ i ], obj[ keys[ i ] ] ];
		}
		return ret;
	}

	function sort( arr ) {
		return arr.sort( ( a, b ) => {
			var ret = a.localeCompare( b );
			if ( ret > 0 ) {
				return 1;
			}
			if ( ret < 0 ) {
				return -1;
			}
			return 0;
		} );
	}

	function objectValues( obj ) {
		return Object.keys( obj ).map( ( k ) => obj[ k ] );
	}

	function escapeHTML( str ) {
		var chars = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;'
		};
		return str.replace( /[&<>]/g, function ( char ) {
			return chars[ char ] || char;
		} );
	}

	function arrayIntersect( arr1, arr2 ) {
		var ret = [];
		for ( var x of arr1 ) {
			if ( arr2.indexOf( x ) !== -1 ) {
				ret.push( x );
			}
		}
		return ret;
	}

	function isEmpty( value ) {
		switch ( typeof value ) {
			case 'boolean':
				return value === false;
			case 'number':
			case 'bigint':
				return value === 0;
			case 'string':
				return value === '';
			case 'object':
				if ( value === null ) {
					return true;
				}
				if ( Array.isArray( value ) ) {
					return value.length === 0;
				}
				return Object.keys( value ).length === 0;
			case 'undefined':
			case 'null':
				return true;
			case 'symbol':
				return false;
		}
	}

	// @credits https://stackoverflow.com/questions/66672931/alternative-for-promise-allsettled
	function promisesAllSettled( promises ) {
		var allSettled = promises.map( function ( promise ) {
			return promise.then( ( value ) => ( {
				status: 'fulfilled',
				value
			} ) ).catch( function ( reason ) {
				// eslint-disable-next-line no-console
				console.error( 'promisesAllSettled catch', reason );
				return {
					status: 'rejected',
					reason
				};
			} );
		} );

		return Promise.all( allSettled );
	}

	return {
		createToolGroup,
		createDisabledToolGroup,
		sortObjectByKeys,
		renameObjectKey,
		getKeyByValue,
		createWindowManager,
		removeNbspFromLayoutHeader,
		destroyDataTable,
		getNestedProp,
		filterObject,
		isObject,
		OOUIAlert,
		createNewLabel,
		createNewKey,
		MockupOOUIClass,
		createDropDownOptions,
		inputNameFromLabel,
		optionsInputs,
		getAvailableInputs,
		inputInstanceFromName,
		isMultiselect,
		getPreferredInput,
		lookupInputs,
		labelFormulaInputs,
		castType,
		decodeHTMLEntities,
		deepCopy,
		isPromise,
		waitUntil,
		executeFunctionByName,
		inArray,
		getInputHelpUrl,
		loadScripts,
		isNaN,
		escapeJsonPointer,
		objectEntries,
		sort,
		objectValues,
		escapeHTML,
		isEmpty,
		arrayIntersect,
		promisesAllSettled,
		nonEnumerableProperty
	};
}() );
