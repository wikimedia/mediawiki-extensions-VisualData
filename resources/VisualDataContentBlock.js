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
 * @copyright Copyright ©2023, https://wikisphere.org
 */

// eslint-disable-next-line no-unused-vars
const VisualDataContentBlock = function ( phpConfig, windowManager ) {
	// eslint-disable-next-line no-unused-vars
	var Config = phpConfig;
	var WindowManager = windowManager;
	var ProcessDialog;
	var Model;
	var ParentObj;
	var panelLayout;
	var CurrentKey;
	var Callback;

	function getPropertyValue( property ) {
		if ( property in Model ) {
			return VisualDataSchemas.getWidgetValue( Model[ property ] );
		}

		if ( !( CurrentKey in ParentObj ) ) {
			return '';
		}

		if ( property in ParentObj[ CurrentKey ].wiki ) {
			return ParentObj[ CurrentKey ].wiki[ property ];
		}
		return '';
	}

	function PanelLayout( config ) {
		PanelLayout.super.call( this, config );

		this.fieldset = new OO.ui.FieldsetLayout( {
			label: ''
		} );

		this.populateFieldset();

		this.$element.append( this.fieldset.$element );
		// this.$element.append(this.messageWidget.$element);
	}

	OO.inheritClass( PanelLayout, OO.ui.PanelLayout );
	PanelLayout.prototype.populateFieldset = function () {
		this.fieldset.clearItems();

		// eslint-disable-next-line no-unused-vars
		var data = this.data;
		var items = [];

		var nameInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'name' ) || CurrentKey
		} );

		Model.name = nameInput;

		items.push(
			new OO.ui.FieldLayout( nameInput, {
				label: mw.msg( 'visualdata-jsmodule-formfield-name' ),
				helpInline: true,
				align: 'top'
			} )
		);

		var contentInput = new OO.ui.MultilineTextInputWidget( {
			value: getPropertyValue( 'content' ),
			autosize: true
		} );

		Model.content = contentInput;

		items.push(
			new OO.ui.FieldLayout( contentInput, {
				label: mw.msg( 'visualdata-jsmodule-contentblock-content' ),
				help: mw.msg( 'visualdata-jsmodule-contentblock-content-help' ),
				helpInline: true,
				align: 'top'
			} )
		);

		items = items.filter( function ( x ) {
			return !( 'items' in x ) || x.items.length;
		} );

		this.isEmpty = !items.length;

		this.fieldset.addItems( items );
	};

	// eslint-disable-next-line no-unused-vars
	PanelLayout.prototype.addItem = function ( property ) {
		this.populateFieldset();
	};

	function ProcessDialog( config ) {
		ProcessDialog.super.call( this, config );
	}
	OO.inheritClass( ProcessDialog, OO.ui.ProcessDialog );

	ProcessDialog.static.name = 'myDialog';
	// ProcessDialog.static.title = mw.msg(
	// "visualdata-jsmodule-manageproperties-define-property"
	// );
	ProcessDialog.static.actions = [
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

	ProcessDialog.prototype.initialize = function () {
		ProcessDialog.super.prototype.initialize.apply( this, arguments );

		panelLayout = new PanelLayout( {
			expanded: false,
			padded: true,
			classes: [ 'visualdata-forms-fields-contentframe' ],
			data: {}
		} );

		var frameA = new OO.ui.PanelLayout( {
			$content: [ panelLayout.$element ],
			expanded: false,
			// framed: false,
			padded: false,
			data: { name: 'manageforms' }
		} );

		this.$body.append( frameA.$element );
	};

	ProcessDialog.prototype.getActionProcess = function ( action ) {
		var dialog = this;

		switch ( action ) {
			case 'save':
				var obj = { type: 'content-block' };
				for ( var i in Model ) {
					obj[ i ] = VisualDataSchemas.getWidgetValue( Model[ i ] );
				}

				var objName = obj.name;
				var alert = null;
				if ( objName === '' ) {
					alert = mw.msg( 'visualdata-jsmodule-formfield-empty-field' );
				} else if ( objName !== CurrentKey && objName in ParentObj ) {
					alert = mw.msg( 'visualdata-jsmodule-formfield-existing-field' );
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

				VisualDataFunctions.renameObjectKey( ParentObj, CurrentKey, objName );

				ParentObj[ objName ] = $.extend( ParentObj[ objName ], { wiki: obj } );

				Callback();

				return new OO.ui.Process( function () {
					dialog.close( { action: action } );
				} );
		}

		return ProcessDialog.super.prototype.getActionProcess.call( this, action );
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

	function openDialog( callback, parentObj, fieldName ) {
		Callback = callback;
		Model = {};
		ParentObj = parentObj;

		CurrentKey =
			fieldName ||
			VisualDataFunctions.createNewKey(
				parentObj,
				mw.msg( 'visualdata-jsmodule-contentblock-newlabel' )
			);

		var processDialog = new ProcessDialog( {
			size: 'large'
		} );

		WindowManager.newWindow(
			processDialog,
			{ title: mw.msg(
				// The following messages are used here:
				// * visualdata-jsmodule-manageproperties-define-property
				// * visualdata-jsmodule-manageproperties-define-property - [name]
				'visualdata-jsmodule-forms-definefield'
			) + ( fieldName ? ' - ' + fieldName : '' ) }
		);
	}

	return {
		openDialog
	};
};
