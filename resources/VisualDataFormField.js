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

// eslint-disable-next-line no-unused-vars
const VisualDataFormField = function ( phpConfig, windowManager, schemas ) {
	var Config = phpConfig;
	var WindowManager = windowManager;
	var Schemas = schemas;
	var VisualDataInputConfigInst = new VisualDataInputConfig(
		phpConfig,
		windowManager
	);

	var ProcessDialog;
	var Model;
	var ParentObj;
	var panelLayout;
	var CurrentKey;
	var Callback;

	function inArray( val, arr ) {
		return arr.indexOf( val ) !== -1;
	}

	function getCurrentItem() {
		if ( !( CurrentKey in ParentObj ) ) {
			return null;
		}
		return ParentObj[ CurrentKey ];
	}

	function getPropertyValue( value, propName ) {
		return VisualDataSchemas.getPropertyValue( value, propName, {
			getCurrentItem: getCurrentItem,
			getModel: getModel
		} );
	}

	function getModel() {
		return Model;
	}

	function getAvailableInputs(
		propertyModel,
		SMWproperty,
		JSONSchemaType,
		stringFormat,
		multipleItems
	) {
		if ( Config.SMW && propertyModel === 'smw-property' ) {
			var dataType = VisualDataSMW.getSemanticProperty( SMWproperty, 'type' );
			if ( !dataType ) {
				// eslint-disable-next-line no-console
				console.error( SMWproperty + ' property does not exist' );
				dataType = '_wpg';
			}
			var ret = VisualDataSMW.getAvailableInputs( dataType );
		} else {
			ret = VisualDataFunctions.getAvailableInputs(
				JSONSchemaType,
				stringFormat,
				Config
			);
		}

		// remove multiselects
		if ( multipleItems === false ) {
			return ret.filter( ( x ) => !VisualDataFunctions.isMultiselect( x ) );
		}

		// remove options inputs and lookup widgets
		// except multiselect
		return ret.filter(
			( x ) =>
				( VisualDataFunctions.lookupInputs.indexOf( x ) === -1 &&
					VisualDataFunctions.optionsInputs.indexOf( x ) === -1 ) ||
				VisualDataFunctions.isMultiselect( x )
		);
	}

	// @TODO move in VisualDataInputConfig ?
	function handleOptionsInputs( availableInputsInput, parentItems ) {
		var items = [];
		var layout = new OO.ui.PanelLayout( {
			expanded: false,
			padded: true,
			framed: true,
			classes: []
		} );
		var fieldset = new OO.ui.FieldsetLayout( {
			label: 'Options'
		} );
		layout.$element.append( fieldset.$element );

		parentItems.push( layout );

		var optionsValues = getPropertyValue( 'options-values' ) || [];

		var selectOptionsFromValue = 'options-values';
		var wikilistValue = getPropertyValue( 'options-wikilist' );

		// @TODO add more data sources
		if ( !optionsValues.length ) {
			if ( wikilistValue ) {
				selectOptionsFromValue = 'options-wikilist';
			} else if ( getPropertyValue( 'options-askquery' ) ) {
				selectOptionsFromValue = 'options-askquery';
			}
		}

		var selectOptionsFrom = new OO.ui.RadioSelectInputWidget( {
			options: [
				{
					data: 'options-values',
					label: mw.msg(
						'visualdata-jsmodule-forms-optionsfrom-values'
					)
				},
				{
					data: 'options-wikilist',
					label: mw.msg(
						'visualdata-jsmodule-forms-optionsfrom-wikilist'
					)
				},
				{
					data: 'options-askquery',
					label: mw.msg(
						'visualdata-jsmodule-forms-optionsfrom-askquery'
					)
				}
			],
			value: selectOptionsFromValue
		} );

		var nullValueInput = new OO.ui.ToggleSwitchWidget( {
			value: getPropertyValue( 'options-allow-null' )
		} );

		var fieldNullValue = new OO.ui.FieldLayout( nullValueInput, {
			label: '',
			help: mw.msg( 'visualdata-jsmodule-forms-field-nullvalue' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldNullValue );

		// used to clear "options-values", "options-wikilist", "options-askquery"
		// Model.selectOptionsFrom = selectOptionsFrom;

		var fieldSelectOptionsFrom = new OO.ui.FieldLayout( selectOptionsFrom, {
			label: new OO.ui.HtmlSnippet(
				mw.msg( 'visualdata-jsmodule-forms-field-options-from' )
			),
			align: 'top'
		} );

		items.push( fieldSelectOptionsFrom );

		var messageWidgetOptionsAskQuery = new OO.ui.MessageWidget( {
			type: 'info',
			label: mw.msg( 'visualdata-jsmodule-formfield-message-options-askquery' ),
			invisibleLabel: false,
			classes: [ 'VisualDataFormFieldMessage' ]
		} );

		items.push( messageWidgetOptionsAskQuery );

		var optionsValuesInput = new OO.ui.TagMultiselectWidget( {
			selected: optionsValues.filter( ( x ) => x !== '' ),
			allowArbitrary: true,
			orientation: 'vertical'
		} );

		var fieldOptionsValues = new OO.ui.FieldLayout( optionsValuesInput, {
			label: '',
			help: mw.msg( 'visualdata-jsmodule-forms-field-options-values' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldOptionsValues );

		var wikilistInput = new mw.widgets.TitleInputWidget( {
			value: wikilistValue
		} );

		var fieldWikilist = new OO.ui.FieldLayout( wikilistInput, {
			label: '',
			help: mw.msg( 'visualdata-jsmodule-forms-field-wikilist' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldWikilist );

		// ////////	@credits: WikiTeq	///////
		var optionsLabelFormulaInput = new OO.ui.MultilineTextInputWidget( {
			value: getPropertyValue( 'options-label-formula' ),
			autosize: true,
			rows: 1
		} );

		var fieldOptionsLabelFormula = new OO.ui.FieldLayout(
			optionsLabelFormulaInput,
			{
				label: mw.msg(
					'visualdata-jsmodule-forms-field-options-label-formula'
				),
				help: mw.msg(
					'visualdata-jsmodule-forms-field-options-label-formula-help'
				),
				helpInline: true,
				align: 'top'
			}
		);

		items.push( fieldOptionsLabelFormula );

		// ///////////////////////////

		function hasVisibleItems( thisFieldset ) {
			for ( var item of thisFieldset.items ) {
				if ( item.isVisible() ) {
					return true;
				}
			}
			return false;
		}

		selectOptionsFrom.on( 'change', function ( value ) {
			fieldOptionsValues.toggle( value === 'options-values' );
			fieldWikilist.toggle( value === 'options-wikilist' );
			fieldOptionsLabelFormula.toggle( value !== 'options-askquery' );
			messageWidgetOptionsAskQuery.toggle( value === 'options-askquery' );
		} );

		var modelMap = {
			selectOptionsFrom: selectOptionsFrom,
			'options-allow-null': nullValueInput,
			'options-values': optionsValuesInput,
			'options-wikilist': wikilistInput,
			'options-label-formula': optionsLabelFormulaInput
		};

		function updateModel( thisVisibleItems ) {
			for ( var i in modelMap ) {
				if ( thisVisibleItems ) {
					Model[ i ] = modelMap[ i ];
				} else {
					delete Model[ i ];
				}
			}
		}

		function onSelectAvailableInputs() {
			var availableInputsValue = availableInputsInput.getValue();
			var thisSelectOptionsFromValue = selectOptionsFrom.getValue();
			var optionInput = inArray( availableInputsValue, VisualDataFunctions.optionsInputs );

			fieldSelectOptionsFrom.toggle( optionInput );

			messageWidgetOptionsAskQuery.toggle( optionInput && thisSelectOptionsFromValue === 'options-wikilist' );
			fieldNullValue.toggle( optionInput );

			fieldOptionsValues.toggle(
				optionInput &&
					( !thisSelectOptionsFromValue ||
						thisSelectOptionsFromValue === 'options-values' )
			);
			fieldWikilist.toggle( optionInput && thisSelectOptionsFromValue === 'options-wikilist' );

			fieldOptionsLabelFormula.toggle(
				thisSelectOptionsFromValue !== 'options-askquery' &&
				inArray( availableInputsValue, VisualDataFunctions.labelFormulaInputs ) &&
				!inArray( availableInputsValue, VisualDataFunctions.lookupInputs )
			);

			var thisVisibleItems = hasVisibleItems( fieldset );
			updateModel( thisVisibleItems );
			layout.toggle( thisVisibleItems );
		}

		fieldset.addItems( items );

		var visibleItems = hasVisibleItems( fieldset );
		updateModel( visibleItems );
		layout.toggle( visibleItems );

		// eslint-disable-next-line no-unused-vars
		availableInputsInput.on( 'change', function ( value ) {
			onSelectAvailableInputs();
		} );

		onSelectAvailableInputs();

		return selectOptionsFrom;
	}

	function handleQueryOptions( availableInputsInput, selectOptionsFrom, parentItems ) {
		var items = [];
		var layout = new OO.ui.PanelLayout( {
			expanded: false,
			padded: true,
			framed: true,
			classes: []
		} );
		var fieldset = new OO.ui.FieldsetLayout( {
			label: 'Options'
		} );
		layout.$element.append( fieldset.$element );

		parentItems.push( layout );

		var askqueryInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'options-askquery' )
		} );

		var fieldAskquery = new OO.ui.FieldLayout( askqueryInput, {
			label: mw.msg( 'visualdata-jsmodule-forms-field-askquery-label' ),
			help: mw.msg( 'visualdata-jsmodule-forms-field-askquery-help' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldAskquery );

		var schemaInput = new OO.ui.DropdownInputWidget( {
			options: VisualDataFunctions.createDropDownOptions(
				Object.keys( Schemas ),
				{ key: 'value' }
			),
			value: getPropertyValue( 'askquery-schema' )
		} );

		var fieldSchema = new OO.ui.FieldLayout( schemaInput, {
			label: mw.msg(
				'visualdata-jsmodule-forms-field-askquery-schema-label'
			),
			help: mw.msg( 'visualdata-jsmodule-forms-field-askquery-schema-help' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldSchema );

		var printoutsInputValue = getPropertyValue( 'askquery-printouts' ) || [];

		// var printoutsInput = new mw.widgets.TitlesMultiselectWidget({
		// 	selected: printoutsInputValue,

		// https://www.semantic-mediawiki.org/wiki/Help:Namespaces
		// 	namespace: 102,
		// });

		var printoutsInput = new OO.ui.TagMultiselectWidget( {
			allowArbitrary: true,
			selected: printoutsInputValue
		} );

		var fieldPrintouts = new OO.ui.FieldLayout( printoutsInput, {
			label: mw.msg( 'visualdata-jsmodule-forms-field-printouts' ),
			help: mw.msg( 'visualdata-jsmodule-forms-field-printouts-help' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldPrintouts );

		var optionFormulaInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'options-query-formula' )
		} );

		var fieldOptionFormula = new OO.ui.FieldLayout( optionFormulaInput, {
			label: mw.msg( 'visualdata-jsmodule-forms-field-optionformula' ),
			help: mw.msg( 'visualdata-jsmodule-forms-field-optionformula-help' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldOptionFormula );

		// ////////	@credits: WikiTeq	///////

		var optionsLabelFormulaInput = new OO.ui.MultilineTextInputWidget( {
			value: getPropertyValue( 'options-label-formula' ),
			autosize: true,
			rows: 1
		} );

		var fieldOptionsLabelFormula = new OO.ui.FieldLayout(
			optionsLabelFormulaInput,
			{
				label: mw.msg(
					'visualdata-jsmodule-forms-field-options-label-formula'
				),
				help: mw.msg(
					'visualdata-jsmodule-forms-field-options-label-formula-help'
				),
				helpInline: true,
				align: 'top'
			}
		);

		items.push( fieldOptionsLabelFormula );
		// ///////////////////////////

		var modelMap = {
			'options-askquery': askqueryInput,
			'askquery-schema': schemaInput,
			'askquery-printouts': printoutsInput,
			'options-query-formula': optionFormulaInput,
			'options-label-formula': optionsLabelFormulaInput
		};

		function updateModel( thisVisibleItems ) {
			for ( var i in modelMap ) {
				if ( thisVisibleItems ) {
					Model[ i ] = modelMap[ i ];
				} else {
					delete Model[ i ];
				}
			}
		}

		function hasVisibleItems( thisFieldset ) {
			for ( var item of thisFieldset.items ) {
				if ( item.isVisible() ) {
					return true;
				}
			}
			return false;
		}

		function onSelectAvailableInputs() {
			var availableInputsValue = availableInputsInput.getValue();
			var selectOptionsFromValue = selectOptionsFrom.getValue();

			var optionInput = ( selectOptionsFromValue === 'options-askquery' &&
				inArray( availableInputsValue, VisualDataFunctions.optionsInputs ) );
			var lookupInput = inArray( availableInputsValue, VisualDataFunctions.lookupInputs );
			var labelFormulaInput = ( selectOptionsFromValue === 'options-askquery' &&
				inArray( availableInputsValue, VisualDataFunctions.labelFormulaInputs ) );

			fieldAskquery.toggle( lookupInput || optionInput );
			fieldPrintouts.toggle( lookupInput || optionInput );
			fieldSchema.toggle( lookupInput || optionInput );
			fieldOptionFormula.toggle( lookupInput || optionInput );
			fieldOptionsLabelFormula.toggle( labelFormulaInput );

			var thisVisibleItems = hasVisibleItems( fieldset );
			updateModel( thisVisibleItems );
			layout.toggle( thisVisibleItems );
		}

		fieldset.addItems( items );

		var visibleItems = hasVisibleItems( fieldset );
		updateModel( visibleItems );
		layout.toggle( visibleItems );

		// eslint-disable-next-line no-unused-vars
		availableInputsInput.on( 'change', function ( value ) {
			onSelectAvailableInputs();
		} );

		selectOptionsFrom.on( 'change', function ( value ) {
			onSelectAvailableInputs();
		} );

		onSelectAvailableInputs();
	}

	function PanelLayout( config ) {
		PanelLayout.super.call( this, config );

		this.fieldset = new OO.ui.FieldsetLayout( {
			label: ''
		} );

		this.populateFieldset();

		this.$element.append( this.fieldset.$element );
	}

	OO.inheritClass( PanelLayout, OO.ui.PanelLayout );
	PanelLayout.prototype.populateFieldset = function () {
		this.fieldset.clearItems();

		// eslint-disable-next-line no-unused-vars
		var data = this.data;
		var items = [];

		var currentItem = getCurrentItem();
		var parentSchema = {};

		// @see VisualDataSchemas
		if (
			currentItem &&
			currentItem.type === 'array' &&
			VisualDataFunctions.isObject( currentItem.items )
		) {
			parentSchema = currentItem;
			currentItem = currentItem.items; // JSON.parse(JSON.stringify(currentItem.items));
		}

		var nameInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'name' ) || CurrentKey
		} );

		Model.name = nameInput;

		items.push(
			new OO.ui.FieldLayout( nameInput, {
				label: mw.msg( 'visualdata-jsmodule-formfield-name' ),
				helpInline: true,
				help: mw.msg( 'visualdata-jsmodule-formfield-name-help' ),
				align: 'top'
			} )
		);

		var labelValue = getPropertyValue( 'label' );

		var labelInput = new OO.ui.TextInputWidget( {
			value: labelValue
		} );

		Model.label = labelInput;

		items.push(
			new OO.ui.FieldLayout( labelInput, {
				label: mw.msg( 'visualdata-jsmodule-formfield-label' ),
				helpInline: true,
				align: 'top'
			} )
		);

		var helpMessageInput = new OO.ui.MultilineTextInputWidget( {
			value: getPropertyValue( 'help-message' ),
			autosize: true,
			rows: 2
		} );

		Model[ 'help-message' ] = helpMessageInput;

		items.push(
			new OO.ui.FieldLayout( helpMessageInput, {
				label: mw.msg( 'visualdata-jsmodule-forms-field-help-message' ),
				helpInline: true,
				help: mw.msg( 'visualdata-jsmodule-forms-contentblock-content-help' ),
				align: 'top'
			} )
		);

		var visibilityInputValue = getPropertyValue( 'visibility' );

		var visibilityInput = new OO.ui.DropdownInputWidget( {
			options: VisualDataFunctions.createDropDownOptions( {
				visible: mw.msg( 'visualdata-jsmodule-forms-visibility-visible' ),
				'oncreate-only': mw.msg(
					'visualdata-jsmodule-forms-visibility-create-only'
				),
				hidden: mw.msg( 'visualdata-jsmodule-forms-visibility-hidden' )
			} ),
			value: visibilityInputValue
		} );

		Model.visibility = visibilityInput;

		items.push(
			new OO.ui.FieldLayout( visibilityInput, {
				label: mw.msg( 'visualdata-jsmodule-forms-field-visibility-label' ),
				help: mw.msg( 'visualdata-jsmodule-forms-field-visibility-help' ),
				helpInline: true,
				align: 'top'
			} )
		);

		var propertyModelValue = 'json-schema';
		if ( Config.SMW ) {
			propertyModelValue = getPropertyValue( 'propertyModel' ) || 'smw-property';
			var propertyModelInput = new OO.ui.RadioSelectInputWidget( {
				options: [
					{
						data: 'smw-property',
						label: mw.msg(
							'visualdata-jsmodule-formfield-propertymodel-smwproperty'
						)
					},
					{
						data: 'json-schema',
						label: mw.msg(
							'visualdata-jsmodule-formfield-propertymodel-jsonschema'
						)
					}
				],
				value: propertyModelValue
			} );

			Model.propertyModel = propertyModelInput;

			items.push(
				new OO.ui.FieldLayout( propertyModelInput, {
					label: mw.msg( 'visualdata-jsmodule-formfield-propertymodel' ),
					helpInline: true,
					align: 'top'
				} )
			);

			var SMWpropertiesValue =
				getPropertyValue( 'SMW-property' ) ||
				Object.keys( VisualDataSMW.getSemanticProperties() )[ 0 ];

			var SMWpropertiesInput = new OO.ui.DropdownInputWidget( {
				options: VisualDataFunctions.createDropDownOptions(
					Object.keys( VisualDataSMW.getSemanticProperties() ),
					{ key: 'value' }
				),
				value: SMWpropertiesValue
			} );

			// eslint-disable-next-line no-unused-vars
			SMWpropertiesInput.on( 'change', function ( value ) {
				redrawAvailableInputs();
			} );

			Model[ 'SMW-property' ] = SMWpropertiesInput;

			var fieldSMWpropertiesInput = new OO.ui.FieldLayout( SMWpropertiesInput, {
				label: mw.msg( 'visualdata-jsmodule-formfield-smwproperties' ),
				helpInline: true,
				align: 'top'
			} );

			items.push( fieldSMWpropertiesInput );
		}

		// var smwTypesInput = new OO.ui.DropdownInputWidget({
		// 	options: VisualDataFunctions.createDropDownOptions(VisualDataSMW.TypeLabels),
		// 	value:
		// });

		var jsonSchemaValue = getPropertyValue( 'jsonSchema-type' ) || 'string';

		var jsonSchemaInput = new OO.ui.DropdownInputWidget( {
			options: VisualDataFunctions.createDropDownOptions(
				[
					'string',
					'number',
					'integer',
					'boolean'
					// select rather a type and toggle "multiple values"
					// "array",
				],
				{ key: 'value' }
			),
			value: jsonSchemaValue
		} );

		Model[ 'jsonSchema-type' ] = jsonSchemaInput;

		var fieldjsonSchemaInput = new OO.ui.FieldLayout( jsonSchemaInput, {
			label: mw.msg( 'visualdata-jsmodule-formfield-schematypes' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldjsonSchemaInput );

		var textFormat = [
			'color',
			'date',
			'datetime',
			'datetime-local',
			'email',
			'month',
			'password',
			'number',
			'range',
			'tel',
			'text',
			'textarea',
			'time',
			'url',
			'week'
		];

		var jsonSchemaFormatValue = getPropertyValue( 'jsonSchema-format' ) || 'text';
		var jsonSchemaFormatInput = new OO.ui.DropdownInputWidget( {
			// , { key: "value" }
			options: VisualDataFunctions.createDropDownOptions( textFormat, {
				key: 'value'
			} ),
			value: jsonSchemaFormatValue
		} );

		// eslint-disable-next-line no-unused-vars
		jsonSchemaFormatInput.on( 'change', function ( value ) {
			redrawAvailableInputs();
		} );

		Model[ 'jsonSchema-format' ] = jsonSchemaFormatInput;

		var fieldjsonSchemaFormatInput = new OO.ui.FieldLayout(
			jsonSchemaFormatInput,
			{
				label: mw.msg( 'visualdata-jsmodule-formfield-schematextsubtypes' ),
				helpInline: true,
				align: 'top'
			}
		);

		items.push( fieldjsonSchemaFormatInput );

		jsonSchemaInput.on( 'change', function ( value ) {
			switch ( value ) {
				case 'string':
					fieldjsonSchemaFormatInput.toggle( true );
					break;
				case 'integer':
				case 'number':
				case 'boolean':
					fieldjsonSchemaFormatInput.toggle( false );
					break;
			}
			redrawAvailableInputs();
		} );

		if ( Config.SMW ) {
			fieldSMWpropertiesInput.toggle( propertyModelValue === 'smw-property' );
		}
		fieldjsonSchemaInput.toggle( propertyModelValue === 'json-schema' );
		fieldjsonSchemaFormatInput.toggle(
			propertyModelValue === 'json-schema' && jsonSchemaValue === 'string'
		);

		if ( Config.SMW ) {
			propertyModelInput.on( 'change', function ( value ) {
				switch ( value ) {
					case 'smw-property':
						fieldSMWpropertiesInput.toggle( true );
						fieldjsonSchemaInput.toggle( false );
						fieldjsonSchemaFormatInput.toggle( false );
						break;
					case 'json-schema':
						fieldSMWpropertiesInput.toggle( false );
						fieldjsonSchemaInput.toggle( true );
						fieldjsonSchemaFormatInput.toggle(
							getPropertyValue( 'jsonSchema-type' ) === 'string'
						);
						break;
				}
				redrawAvailableInputs();
			} );
		}

		var multipleItemsInputValue =
			getPropertyValue( 'multiple-items' ) || parentSchema.type === 'array';
		var multipleItemsInput = new OO.ui.ToggleSwitchWidget( {
			value: multipleItemsInputValue
		} );

		Model[ 'multiple-items' ] = multipleItemsInput;

		var layoutParentSchema = VisualDataSchemas.parentSchemaContainer(
			( Model.parentSchema = {} ),
			{
				getPropertyValue: getPropertyValue
			}
		);
		layoutParentSchema.toggle( multipleItemsInputValue );

		var messageWidget = new OO.ui.MessageWidget( {
			type: 'info',
			label: mw.msg( 'visualdata-jsmodule-formfield-message-more-inputs' ),
			invisibleLabel: false,
			classes: [ 'VisualDataFormFieldMessage' ]
		} );

		var fieldMultipleValues = new OO.ui.FieldLayout( multipleItemsInput, {
			label: mw.msg( 'visualdata-jsmodule-formfield-multiple-values' ),
			help: '',
			helpInline: true,
			align: 'top'
		} );

		items.push( fieldMultipleValues );
		items.push( layoutParentSchema );

		var availableInputsValue = getPropertyValue( 'preferred-input' );
		// preferred input based on property type
		var availableInputsInput = new OO.ui.DropdownInputWidget( {
			// , { key: "value" }
			options: VisualDataFunctions.createDropDownOptions(
				getAvailableInputs(
					propertyModelValue,
					SMWpropertiesValue,
					jsonSchemaValue,
					jsonSchemaFormatValue,
					multipleItemsInputValue
				),
				{
					key: 'value'
				}
			),
			value: availableInputsValue
		} );

		availableInputsInput.on( 'change', function ( value ) {
			var thisDefaultValueInput = getDefaultValueInput();

			// eslint-disable-next-line no-use-before-define
			Model.default = defaultValueInput;

			if (
				value === 'OO.ui.SelectFileWidget' &&
				!( 'accept' in thisDefaultValueInput )
			) {
				thisDefaultValueInput.accept = Config.allowedMimeTypes;
			}
		} );

		visibilityInput.on( 'change', function ( value ) {
			onToggleHiddenInput( value === 'hidden' );
		} );

		Model[ 'preferred-input' ] = availableInputsInput;

		var inputConfigButton = new OO.ui.ButtonWidget( {
			icon: 'settings',
			flags: []
		} );

		var defaultInputConfig = getPropertyValue( 'input-config' ) || {};

		Model[ 'input-config' ] = new VisualDataFunctions.MockupOOUIClass(
			defaultInputConfig
		);

		inputConfigButton.on( 'click', function () {
			var dataType = null;
			if ( Config.SMW ) {
				var SMWproperty = getPropertyValue( 'SMW-property' );
				dataType = VisualDataSMW.getSemanticProperty( SMWproperty, 'type' );
				if ( !dataType ) {
					// eslint-disable-next-line no-console
					console.error( SMWproperty + ' property does not exist' );
					dataType = '_wpg';
				}
			}
			VisualDataInputConfigInst.openDialog(
				Model[ 'input-config' ],
				availableInputsInput.getValue(),
				dataType
			);
		} );

		items.push( messageWidget );

		items.push(
			new OO.ui.ActionFieldLayout( availableInputsInput, inputConfigButton, {
				label: mw.msg( 'visualdata-jsmodule-formfield-availableinputs' ),
				helpInline: true,
				align: 'top'
			} )
		);

		var selectOptionsFrom = handleOptionsInputs( availableInputsInput, items );
		handleQueryOptions( availableInputsInput, selectOptionsFrom, items );

		var requiredInput = new OO.ui.ToggleSwitchWidget( {
			value: !!getPropertyValue( 'required' )
		} );

		Model.required = requiredInput;

		var fieldRequiredInput = new OO.ui.FieldLayout( requiredInput, {
			label: mw.msg( 'visualdata-jsmodule-formfield-required' ),
			helpInline: true,
			align: 'top'
		} );

		multipleItemsInput.on( 'change', function ( value ) {
			redrawAvailableInputs();
			layoutParentSchema.toggle( value );
			fieldRequiredInput.toggle( !value );
		} );

		fieldRequiredInput.toggle( !multipleItemsInputValue );

		items.push( fieldRequiredInput );

		function getDefaultValueInput() {
			// @ATTENTION ! don't get the specific input othwerwise
			// the default values cannot be parsed as wikitext
			// print always a textInput and cast
			// the value server-side

			var ret;

			// var availableInputs = getAvailableInputs(
			// 	getPropertyValue("propertyModel") || "json-schema",
			// 	getPropertyValue("SMW-property"),
			// 	getPropertyValue("jsonSchema-type"),
			// 	"text",
			// 	getPropertyValue("multiple-items")
			// );

			// @TODO use instead availableInputsInput.getValue()
			// as long as all the inputs support the standard
			// OOUI interface for the use with OO.ui.TagMultiselectWidget
			// -> inputWidget
			// var intputName = availableInputs[0]; // availableInputsInput.getValue()

			// var inputWidget = VisualDataFunctions.inputInstanceFromName(
			// 	intputName,
			// 	{
			// 		id: "visualdata-jsmodule-formfield-default-value-input",
			// 	}
			// );

			var inputWidget = new OO.ui.TextInputWidget( {
				// value: getPropertyValue( 'default' ),
				id: 'visualdata-jsmodule-formfield-default-value-input'
			} );

			if ( !getPropertyValue( 'multiple-items' ) ) {
				if ( 'default' in Model ) {
					var value = Model.default.getValue();
					if ( Array.isArray( value ) && value.length ) {
						Model.default.setValue( value[ 0 ] );
					}
				}

				inputWidget.setValue( getPropertyValue( 'default' ) );
				// set the proper input for each type

				ret = inputWidget;
				// return new OO.ui.TextInputWidget({
				// 	value: getPropertyValue("default"),
				// 	id: "visualdata-jsmodule-formfield-default-value-input",
				// });
			} else {
				// OO.ui.TagMultiselectWidget -> inputWidget: inputWidget does not work
				// with OO.ui.ToggleSwitchWidget
				// if (intputName === "OO.ui.ToggleSwitchWidget") {
				// 	inputWidget = new OO.ui.NumberInputWidget({
				// 		min: 0,
				// 		max: 1,
				// 		id: "visualdata-jsmodule-formfield-default-value-input",
				// 	});
				// }

				var value = [];
				var val = getPropertyValue( 'default' );

				if ( Array.isArray( val ) ) {
					value = val;
				} else if ( val !== '' ) {
					value = [ val ];
				}

				ret = new OO.ui.TagMultiselectWidget( {
					value: value,
					selected: value,
					allowArbitrary: true,
					allowEditTags: true,
					allowReordering: true,
					// 0 means unlimited
					// tagLimit: !!multipleItemsInputValue ? 0 : 1,
					draggable: true,
					inputPosition: 'outline',
					inputWidget: inputWidget,
					id: 'visualdata-jsmodule-formfield-default-value-input'
				} );
			}
			$( '#visualdata-jsmodule-formfield-default-value-input' ).replaceWith(
				ret.$element
			);

			return ret;
		}

		var defaultValueInput = getDefaultValueInput();

		Model.default = defaultValueInput;

		items.push(
			new OO.ui.FieldLayout( defaultValueInput, {
				label: mw.msg( 'visualdata-jsmodule-formfield-default' ),
				help: mw.msg( 'visualdata-jsmodule-formfield-default-value-help' ),
				helpInline: true,
				align: 'top'
			} )
		);

		var valueFormulaInput = new OO.ui.MultilineTextInputWidget( {
			value: getPropertyValue( 'value-formula' ),
			autosize: true,
			rows: 1
		} );

		Model[ 'value-formula' ] = valueFormulaInput;

		items.push(
			new OO.ui.FieldLayout( valueFormulaInput, {
				label: mw.msg( 'visualdata-jsmodule-forms-field-valueformula' ),
				help: mw.msg( 'visualdata-jsmodule-forms-field-valueformula-help' ),
				helpInline: true,
				align: 'top'
			} )
		);

		function onToggleHiddenInput( hidden ) {
			if ( hidden ) {
				Model[ 'preferred-input' ].setValue( 'OO.ui.TextInputWidget' );
			}
			availableInputsInput.setDisabled( hidden );
			requiredInput.setDisabled( hidden );
			fieldMultipleValues.toggle( !hidden );
		}

		if ( visibilityInputValue === 'hidden' ) {
			onToggleHiddenInput( true );
		}

		function redrawAvailableInputs() {
			availableInputsInput.setOptions(
				VisualDataFunctions.createDropDownOptions(
					getAvailableInputs(
						getPropertyValue( 'propertyModel' ) || 'json-schema',
						getPropertyValue( 'SMW-property' ),
						getPropertyValue( 'jsonSchema-type' ),
						getPropertyValue( 'jsonSchema-format' ),
						getPropertyValue( 'multiple-items' )
					),
					{
						key: 'value'
					}
				)
			);

			var thisDefaultValueInput = getDefaultValueInput();
			Model.default = thisDefaultValueInput;
		}

		items = items.filter( function ( x ) {
			return !( 'items' in x ) || x.items.length;
		} );

		this.isEmpty = !items.length;

		this.fieldset.addItems( items );

		setTimeout( function () {
			VisualDataFunctions.removeNbspFromLayoutHeader(
				'#visualdata-processDialogEditField'
			);
		}, 30 );
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
			classes: [],
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

		var currentItem = getCurrentItem() || {
			type: '',
			wiki: { type: 'property' }
		};
		var parentSchema = currentItem;
		if (
			currentItem.type === 'array' &&
			VisualDataFunctions.isObject( currentItem.items )
		) {
			currentItem = currentItem.items;
		}

		function getValueRec( model, thisObj ) {
			for ( var i in model ) {
				if ( !( 'getValue' in model[ i ] ) ) {
					getValueRec( model[ i ], ( thisObj[ i ] = {} ) );
				} else {
					thisObj[ i ] = VisualDataSchemas.getWidgetValue( model[ i ] );
				}
			}
		}

		switch ( action ) {
			case 'save':
				var obj = { type: 'property' };
				getValueRec( Model, obj );

				var objName = obj[ 'multiple-items' ] ? obj.parentSchema.name : obj.name;

				switch ( obj.propertyModel ) {
					case 'json-schema':
						delete obj[ 'SMW-property' ];
						break;
					case 'smw-property':
						// *** important! used to recover the type
						// if a property has been deleted
						obj[ 'smw-property-type' ] = VisualDataSMW.getSemanticProperty(
							obj[ 'SMW-property' ],
							'type'
						);
						// delete obj["jsonSchema-type"];
						// delete obj["jsonSchema-format"];
						break;
				}

				var alert = null;
				if ( objName === '' ) {
					alert = mw.msg( 'visualdata-jsmodule-schemas-alert-noname' );
				} else if ( objName !== CurrentKey && objName in ParentObj ) {
					alert = mw.msg( 'visualdata-jsmodule-schemas-alert-existing-item' );
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

				ParentObj[ objName ] = VisualDataSchemas.handleSaveArray(
					parentSchema,
					obj
				);

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
				mw.msg( 'visualdata-jsmodule-formfield-newlabel' )
			);

		var processDialog = new ProcessDialog( {
			size: 'large',
			classes: [],
			id: 'visualdata-processDialogEditField'
		} );

		WindowManager.newWindow( processDialog, {
			title:
				mw.msg(
					// The following messages are used here:
					// * visualdata-jsmodule-manageproperties-define-property
					// * visualdata-jsmodule-manageproperties-define-property - [name]
					'visualdata-jsmodule-forms-definefield'
				) + ( fieldName ? ' - ' + fieldName : '' )
		} );
	}

	return {
		openDialog
	};
};
