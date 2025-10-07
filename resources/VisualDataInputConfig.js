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

/* eslint-disable no-tabs */

// @see https://doc.wikimedia.org/oojs-ui/master/js/
// eslint-disable-next-line no-unused-vars
const VisualDataInputConfig = function ( phpConfig, windowManager ) {
	// eslint-disable-next-line no-unused-vars
	var Config = phpConfig;
	var WindowManager = windowManager;
	var ProcessDialog;
	var DialogSearchName = 'dialogSearch';
	var processDialogSearch;
	var Model;
	var InputName;
	var CustomInputConfig;
	var Callback;
	var panelLayout;
	var SelectedItems = {};
	var HelpUrl;

	function inArray( val, arr ) {
		return arr.includes( val );
	}

	// @TODO add default for each of them
	function getInputConfig( inputName ) {
		switch ( inputName ) {
			case 'mw.widgets.UserInputWidget':
			case 'mw.widgets.TitleInputWidget':
			case 'mw.widgets.DateInputWidget':
			case 'OO.ui.TextInputWidget':
			case 'LookupElement':
				var ret = {
					accessKey: [ 'string', 'The access key' ],
					autocomplete: [
						'boolean', // 'boolean|string',
						'Should the browser support autocomplete for this field?'
					],
					autofocus: [
						'boolean',
						'Use an HTML autofocus attribute to instruct the browser to focus this widget.'
					],
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					flags: [
						'string',
						"The name or names of the flags (e.g., 'progressive' or 'primary') to apply."
					],
					icon: [
						'string',
						'The symbolic name of the icon (e.g., ‘remove’ or ‘menu’), or a map of symbolic names.'
					],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					indicator: [
						'string',
						'Symbolic name of the indicator (e.g. ‘required’ or ‘down’).'
					],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					invisibleLabel: [
						'boolean',
						'Whether the label should be visually hidden (but still accessible to screen-readers).'
					],
					label: [ 'string', 'The label text' ],
					labelPosition: [
						'string',
						"The position of the inline label relative to that of the value or placeholder text: 'before' or 'after'"
					],
					maxLength: [
						'integer',
						'Maximum number of characters allowed in the input.'
					],
					minLength: [
						'integer',
						'Minimum number of characters allowed in the input.'
					],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					placeholder: [ 'string', 'Placeholder text' ],
					readOnly: [
						'boolean',
						'Prevent changes to the value of the text input.'
					],
					spellcheck: [
						'boolean',
						'Should the browser support spellcheck for this field (undefined means leaving it up to the browser).'
					],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ],
					type: [
						'string',
						"The value of the HTML type attribute: 'text', 'password', 'email', 'url' or 'number'."
					],
					validate: [
						'string', // regex
						'A regular expression that must match the value for it to be considered valid. See <a target="_blank" href="https://json-schema.org/understanding-json-schema/reference/regular_expressions">Regular Expressions</a>'
					]
					// value: ["string", "The value of the input."],
				};

				switch ( inputName ) {
					case 'mw.widgets.DateInputWidget':
						return jQuery.extend( ret, {
							precision: [ 'string', "Date precision to use, 'day' or 'month'" ],
							inputFormat: [
								'string',
								'Date format string to use for the textual input field'
							],
							displayFormat: [
								'string',
								'Date format string to use for the clickable label'
							],
							longDisplayFormat: [
								'boolean',
								'If a custom displayFormat is not specified, use unabbreviated day of the week and month names in the default language-specific displayFormat'
							],
							placeholderLabel: [
								'string',
								'Placeholder text shown when the widget is not'
							],
							placeholderDateFormat: [
								'string',
								"User-visible date format string displayed in the textual input field when it's empty"
							],
							mustBeAfter: [ 'date', 'Validates the date to be after this' ],
							mustBeBefore: [ 'date', 'Validates the date to be before this' ]
						} );

					case 'mw.widgets.TitleInputWidget':
						return jQuery.extend( ret, {
							limit: [ 'integer', 'Number of results to show' ],
							namespace: [ 'integer', 'Namespace to prepend to queries' ],
							maxLength: [ 'integer', 'Maximum query length' ],
							relative: [
								'boolean',
								'If a namespace is set, display titles relative to it'
							],
							suggestions: [ 'boolean', 'Display search suggestions' ],
							showRedirectTargets: [ 'boolean', 'Show the targets of redirects' ],
							showImages: [ 'boolean', 'Show page images' ],
							showDescriptions: [ 'boolean', 'Show page descriptions' ],
							showDisambigsLast: [
								'boolean',
								'Show disambiguation pages as the last results'
							],
							showMissing: [ 'boolean', 'Show missing pages' ],
							showInterwikis: [
								'boolean',
								'Show pages with a valid interwiki prefix'
							],
							addQueryInput: [ 'boolean', "Add exact user's input query to results" ],
							excludeCurrentPage: [
								'boolean',
								'Exclude the current page from suggestions'
							],
							excludeDynamicNamespaces: [
								'boolean',
								'Exclude pages whose namespace is negative'
							],
							validateTitle: [ 'boolean', 'Whether the input must be a valid title' ],
							required: [ 'boolean', 'Whether the input must not be empty' ],
							highlightSearchQuery: [
								'boolean',
								'Highlight the partial query the user used for this title'
							]
						} );

					case 'mw.widgets.UserInputWidget':
						return jQuery.extend( ret, {
							limit: [ 'integer', 'Number of results to show' ]
						} );

					default:
						return ret;
				}

			case 'OO.ui.ToggleSwitchWidget':
				return {
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ]
					// value: ["string", "The value of the input."],
				};

			case 'OO.ui.RadioSelectInputWidget':
				return {
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					// options: ["array", "Array of menu options"],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text' ]
				};

			case 'OO.ui.NumberInputWidget':
				return {
					accessKey: [ 'string', 'The access key' ],
					autocomplete: [
						'boolean', // 'boolean|string',
						'Should the browser support autocomplete for this field?'
					],
					autofocus: [
						'boolean',
						'Use an HTML autofocus attribute to instruct the browser to focus this widget.'
					],
					buttonStep: [
						'integer',
						'Delta when using the buttons or Up/Down arrow keys'
					],
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					flags: [
						'string',
						"The name or names of the flags (e.g., 'progressive' or 'primary') to apply."
					],
					icon: [
						'string',
						'The symbolic name of the icon (e.g., ‘remove’ or ‘menu’), or a map of symbolic names.'
					],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					indicator: [
						'string',
						'Symbolic name of the indicator (e.g. ‘required’ or ‘down’).'
					],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					invisibleLabel: [
						'boolean',
						'Whether the label should be visually hidden (but still accessible to screen-readers).'
					],
					label: [ 'string', 'The label text' ],
					labelPosition: [
						'string',
						"The position of the inline label relative to that of the value or placeholder text: 'before' or 'after'"
					],
					max: [ 'number', 'Maximum allowed value' ],
					maxLength: [
						'integer',
						'Maximum number of characters allowed in the input.'
					],
					min: [ 'number', 'Minimum allowed value' ],
					minLength: [
						'integer',
						'Minimum number of characters allowed in the input.'
					],
					// minusButton: [
					// 	'object',
					// 	'Configuration options to pass to the decrementing button widget'
					// ],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					pageStep: [
						'integer',
						'Delta when using the Page-up/Page-down keys. Defaults to 10 times buttonStep'
					],
					placeholder: [ 'string', 'Placeholder text' ],
					// plusButton: [
					// 	'object',
					// 	'Configuration options to pass to the incrementing button widget.'
					// ],
					readOnly: [
						'boolean',
						'Prevent changes to the value of the text input.'
					],
					showButtons: [
						'boolean',
						'Whether to show the plus and minus buttons.'
					],
					spellcheck: [
						'boolean',
						'Should the browser support spellcheck for this field (undefined means leaving it up to the browser).'
					],
					step: [
						'integer',
						'If specified, the field only accepts values that are multiples of this.'
					],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ],
					type: [
						'string',
						"The value of the HTML type attribute: 'text', 'password', 'email', 'url' or 'number'."
					],
					validate: [
						'string', // regex
						'A regular expression that must match the value for it to be considered valid'
					]
					// value: ["string", "The value of the input."],
				};

			case 'mw.widgets.UsersMultiselectWidget':
			case 'mw.widgets.TitlesMultiselectWidget':
			case 'mw.widgets.CategoryMultiselectWidget':
			case 'OO.ui.TagMultiselectWidget':
			case 'OO.ui.MenuTagMultiselectWidget':
			case 'MenuTagSearchMultiselect':
				var ret = {
					allowArbitrary: [
						'boolean',
						'Allow data items to be added even if not present in the menu.'
					],
					allowDisplayInvalidTags: [
						'boolean',
						'Allow the display of invalid tags.'
					],
					allowDuplicates: [ 'boolean', 'Allow duplicate items to be added' ],
					allowEditTags: [
						'boolean',
						'Allow editing of the tags by clicking them'
					],
					allowReordering: [ 'boolean', 'Allow reordering of the items' ],
					allowedValues: [
						'array',
						'An array representing the allowed items by their datas'
					],
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					disabled: [ 'boolean', 'Disable the widget.' ],
					draggable: [ 'boolean', 'The items are draggable.' ],
					flags: [
						'string',
						"The name or names of the flags (e.g., 'progressive' or 'primary') to apply."
					],
					icon: [
						'string',
						'The symbolic name of the icon (e.g., ‘remove’ or ‘menu’), or a map of symbolic names.'
					],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					indicator: [
						'string',
						'Symbolic name of the indicator (e.g. ‘required’ or ‘down’).'
					],
					// input: [ 'object', 'Configuration options for the input widget' ],

					inputPosition: [
						'string',
						'Position of the input. Options are: - inline: The input is invisible, but exists inside the tag list, so the user types into the tag groups to add tags. - outline: The input is underneath the tag area. - none: No input supplied'
					],
					// items: ["array", ""],
					// menu: [ 'object', 'Configuration object for the menu widget' ],

					// options: ["array", "Array of menu options"],
					orientation: [
						'string',
						"Item orientation: 'horizontal' or 'vertical'."
					],
					placeholder: [ 'string', 'Placeholder text' ],
					// selected: ["array", "A set of selected tags"],
					tagLimit: [
						'integer',
						'An optional limit on the number of selected options'
					],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text' ]
				};
				switch ( inputName ) {
					case 'OO.ui.MenuTagMultiselectWidget':
						return jQuery.extend( ret, {
							clearInputOnChoose: [
								'boolean',
								'Clear the text input value when a menu option is chosen'
							]
						} );
					case 'mw.widgets.CategoryMultiselectWidget':
						return jQuery.extend( ret, {
							limit: [ 'integer', 'Maximum number of results to load' ]
						} );
					case 'mw.widgets.TitlesMultiselectWidget':
						return jQuery.extend( ret, {
							clearInputOnChoose: [ 'boolean', 'clear input on choose' ],
							inputPosition: [ 'string', 'input position' ],

							allowEditTags: [ 'boolean', 'clear input on choose' ]
						} );
					case 'mw.widgets.UsersMultiselectWidget':
						return jQuery.extend( ret, {
							limit: [ 'integer', 'Number of results to show' ],
							// name: [
							// 	'string',
							// 	'Name of input to submit results (when used in HTML forms)'
							// ],
							ipAllowed: [ 'boolean', 'Show IP addresses in autocomplete menu' ],
							'ipRangeLimits.IPv4': [ 'integer', ' Maximum allowed IPv4 range' ],
							'ipRangeLimits.IPv6': [ 'integer', ' Maximum allowed IPv6 range' ]
						} );
					default:
						return ret;
				}

			case 'OO.ui.ComboBoxInputWidget':
				return {
					accessKey: [ 'string', 'The access key' ],
					autocomplete: [
						'boolean', // |string
						'Should the browser support autocomplete for this field?'
					],
					autofocus: [
						'boolean',
						'Use an HTML autofocus attribute to instruct the browser to focus this widget.'
					],
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					flags: [
						'string',
						"The name or names of the flags (e.g., 'progressive' or 'primary') to apply."
					],
					icon: [
						'string',
						'The symbolic name of the icon (e.g., ‘remove’ or ‘menu’), or a map of symbolic names.'
					],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					indicator: [
						'string',
						'Symbolic name of the indicator (e.g. ‘required’ or ‘down’).'
					],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					invisibleLabel: [
						'boolean',
						'Whether the label should be visually hidden (but still accessible to screen-readers).'
					],
					label: [ 'string', 'The label text' ],
					labelPosition: [
						'string',
						"The position of the inline label relative to that of the value or placeholder text: 'before' or 'after'"
					],
					maxLength: [
						'integer',
						'Maximum number of characters allowed in the input.'
					],
					// menu: [
					// 	'object',
					// 	'configuration options to pass to the menu select widget'
					// ],
					minLength: [
						'integer',
						'Minimum number of characters allowed in the input.'
					],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					// options: [
					// 	"object",
					// 	"onfiguration options to pass to the menu select widget",
					// ],
					placeholder: [ 'string', 'Placeholder text' ],
					readOnly: [
						'boolean',
						'Prevent changes to the value of the text input.'
					],
					spellcheck: [
						'boolean',
						'Should the browser support spellcheck for this field (undefined means leaving it up to the browser).'
					],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ],
					type: [
						'string',
						"The value of the HTML type attribute: 'text', 'password', 'email', 'url' or 'number'."
					],
					validate: [
						'string', // regex
						'A regular expression that must match the value for it to be considered valid'
					]
					// value: ["string", "The value of the input."],
				};

			case 'OO.ui.MultilineTextInputWidget':
				return {
					accessKey: [ 'string', 'The access key' ],
					autocomplete: [
						'boolean', // 'boolean|string',
						'Should the browser support autocomplete for this field?'
					],
					autofocus: [
						'boolean',
						'Use an HTML autofocus attribute to instruct the browser to focus this widget.'
					],
					autosize: [
						'boolean',
						'Automatically resize the text input to fit its content'
					],
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					flags: [
						'string',
						"The name or names of the flags (e.g., 'progressive' or 'primary') to apply."
					],
					icon: [
						'string',
						'The symbolic name of the icon (e.g., ‘remove’ or ‘menu’), or a map of symbolic names.'
					],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					indicator: [
						'string',
						'Symbolic name of the indicator (e.g. ‘required’ or ‘down’).'
					],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					invisibleLabel: [
						'boolean',
						'Whether the label should be visually hidden (but still accessible to screen-readers).'
					],
					label: [ 'string', 'The label text' ],
					labelPosition: [
						'string',
						"The position of the inline label relative to that of the value or placeholder text: 'before' or 'after'"
					],
					maxLength: [
						'integer',
						'Maximum number of characters allowed in the input.'
					],
					maxRows: [
						'integer',
						'Maximum number of rows to display when autosize is set to true'
					],
					minLength: [
						'integer',
						'Minimum number of characters allowed in the input.'
					],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					placeholder: [ 'string', 'Placeholder text' ],
					readOnly: [
						'boolean',
						'Prevent changes to the value of the text input.'
					],
					rows: [
						'integer',
						'Number of visible lines in textarea. If used with autosize, specifies minimum number of rows to display.'
					],
					spellcheck: [
						'boolean',
						'Should the browser support spellcheck for this field (undefined means leaving it up to the browser).'
					],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ],
					type: [
						'string',
						"The value of the HTML type attribute: 'text', 'password', 'email', 'url' or 'number'."
					],
					validate: [
						'string', // regex
						'A regular expression that must match the value for it to be considered valid'
					]
					// value: ["string", "The value of the input."],
				};

			case 'OO.ui.MultiselectWidget':
				return {
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					// items: ['array', 'An array of options to add to the multiselect'],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ]
				};

			case 'OO.ui.ButtonSelectWidget':
				return {
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					items: [ 'array', 'An array of options to add to the multiselect' ],
					multiselect: [ 'boolean', 'Allow for multiple selections' ],
					text: [ 'string', 'Text to insert' ]
				};

			case 'OO.ui.CheckboxMultiselectInputWidget':
				return {
					accessKey: [ 'string', 'The access key' ],
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					// options: [
					// 	'array',
					// 	'Array of menu options in the format described above.'
					// ],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ]
				};

			case 'OO.ui.DropdownInputWidget':
				return {
					accessKey: [ 'string', 'The access key' ],

					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					// dropdown: [ 'object', 'Configuration options for DropdownWidget' ],

					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],

					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],

					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					// options: [
					// 	'array',
					// 	'Array of menu options in the format described above.'
					// ],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ]
					// value: ["string", "The value of the input."],
				};

			case 'OO.ui.InputWidget':
			case 'mw.widgets.datetime.DateTimeInputWidget':
				var ret = {
					accessKey: [ 'string', 'The access key' ],
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					text: [ 'string', 'Text to insert' ],
					title: [ 'string', 'The title text.' ]
					// value: ["string", "The value of the input."],
				};

				switch ( inputName ) {
					case 'mw.widgets.datetime.DateTimeInputWidget':
						return jQuery.extend( ret, {
							type: [ 'string', "Whether to act like a 'date'" ],
							required: [ 'boolean', 'Whether a value is required' ],
							clearable: [ 'boolean', 'Whether to provide for blanking the value.' ],
							// value: [
							// 	'boolean',
							// 	'Default value for the widget'
							// ],
							min: [ 'string', ' Minimum allowed date' ],
							max: [ 'string', 'Maximum allowed date' ]
						} );
					default:
						return ret;
				}

			case 'ButtonMultiselectWidget':
				return {
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					text: [ 'string', 'Text to insert' ]
				};

			case 'intl-tel-input':
				// @see https://github.com/jackocnr/intl-tel-input
				return {
					allowDropdown: [ 'boolean', 'Whether or not to allow the dropdown' ],
					autoInsertDialCode: [
						'Boolean',
						'When enabled (requires nationalMode to be disabled), the international dial code will be automatically inserted into the input'
					],
					autoPlaceholder: [
						'string',
						"Set the input's placeholder to an example number for the selected country, and update it if the country changes"
					],
					customContainer: [
						'string',
						'Additional classes to add to the parent div.'
					],
					customPlaceholder: [
						'string',
						'Change the placeholder generated by autoPlaceholder. Must return a string'
					],
					excludeCountries: [
						'array',
						'In the dropdown, display all countries except the ones you specify here.'
					],
					formatOnDisplay: [
						'boolean',
						'Format the input value (according to the nationalMode option) during initialisation, and on setNumber. Requires the utilsScript option'
					],
					geoIpLookup: [
						'boolean',
						'When setting initialCountry to "auto", you must use this option to specify a custom function that looks up the user\'s location, and then calls the success callback with the relevant country code'
					],
					hiddenInput: [ 'string', 'Add a hidden input with the given name.' ],
					initialCountry: [
						'string',
						'Set the initial country selection by specifying its country code'
					],
					// 'localizedCountries': [
					// 	'object',
					// 	'Allow localisation of country names'
					// ],
					nationalMode: [
						'boolean',
						'Format numbers in the national format, rather than the international format.'
					],
					onlyCountries: [
						'array',
						'In the dropdown, display only the countries you specify'
					],
					placeholderNumberType: [
						'string',
						'Specify one of the keys from the global enum intlTelInputUtils.numberType'
					],
					preferredCountries: [
						'array',
						'Specify the countries to appear at the top of the list'
					],
					separateDialCode: [
						'boolean',
						'Display the country dial code next to the selected flag'
					],
					showFlags: [
						'boolean',
						'Set this to false to hide the flags e.g. for political reasons'
					],
					utilsScript: [
						'string',
						'Enable formatting/validation etc. by specifying the URL of the included utils.js script (or alternatively just point it to the file on cdnjs.com)'
					]
				};

			case 'RatingWidget':
				return {
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					],
					disabled: [ 'boolean', 'Disable the widget.' ],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					text: [ 'string', 'Text to insert' ]
				};

			case 'VisualEditor':
				return {
					classes: [
						'string',
						'The names of the CSS classes to apply to the element.'
					]
					// contentModel: [ 'string', 'Output (wikitext or html)' ],
				};

			case 'OO.ui.SelectFileWidget':
				return {
					accept: [ 'array', 'MIME types to accept.' ],
					accessKey: [ 'string', 'The access key' ],
					// button: [
					// 	'object',
					// 	'Config to pass to select file button.'
					// ],
					// @TODO uncomment ...
					// buttonOnly: [
					// 	'boolean',
					// 	'Show only the select file button, no info field. Requires showDropTarget to be false'
					// ],
					dir: [ 'string', 'The directionality of the input (ltr/rtl).' ],
					disabled: [ 'boolean', 'Disable the widget.' ],
					droppable: [ 'boolean', 'Whether to accept files by drag and drop' ],
					icon: [
						'string',
						'The symbolic name of the icon (e.g., ‘remove’ or ‘menu’), or a map of symbolic names.'
					],
					id: [ 'string', 'The HTML id attribute used in the rendered tag.' ],
					inputFilter: [
						'string',
						'The name of an input filter function. Input filters modify the value of an input before it is accepted'
					],
					inputId: [ 'string', 'The value of the input’s HTML id attribute.' ],
					// multiple: [
					// 	'boolean',
					// 	'Allow multiple files to be selected'
					// ],
					invisibleLabel: [
						'boolean',
						'Whether the label should be visually hidden (but still accessible to screen-readers).'
					],
					name: [ 'string', 'The value of the input’s HTML name attribute.' ],
					notsupported: [
						'string',
						'Text to display when file support is missing in the browser.'
					],
					placeholder: [ 'string', 'Placeholder text' ],
					showDropTarget: [
						'boolean',
						'Whether to show a drop target. Requires droppable to be true.'
					],
					text: [ 'string', 'Text to insert' ],
					thumbnailSizeLimit: [
						'number',
						'File size limit in MiB above which to not try and show a preview (for performance)'
					],
					title: [ 'string', 'The title text.' ]
					// value: ["string", "The value of the input."],
				};
		}
	}

	function createToolbarB() {
		var toolFactory = new OO.ui.ToolFactory();
		var toolGroupFactory = new OO.ui.ToolGroupFactory();

		var toolbar = new OO.ui.Toolbar( toolFactory, toolGroupFactory, {
			actions: true
		} );

		var onSelect = function () {
			var toolName = this.getName();

			switch ( toolName ) {
				case 'addfield':
					openSearchDialog();
					break;
			}

			this.setActive( false );
		};

		var toolGroup = [
			{
				name: 'addfield',
				icon: 'add',
				title: mw.msg( 'visualdata-jsmodule-inputconfig-addremoveoptions' ),
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

	// @see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/c2805c7e9e83e2f3a857451d46c80231d1658a0f/demos/classes/SearchWidgetDialog.js
	function ProcessDialogSearch( config ) {
		ProcessDialogSearch.super.call( this, config );
	}
	OO.inheritClass( ProcessDialogSearch, OO.ui.ProcessDialog );
	ProcessDialogSearch.static.name = DialogSearchName;
	ProcessDialogSearch.static.title = mw.msg(
		'visualdata-jsmodule-inputconfig-selectfield'
	);
	ProcessDialogSearch.prototype.initialize = function () {
		ProcessDialogSearch.super.prototype.initialize.apply( this, arguments );
		var self = this;
		this.selectedItems = Object.keys( SelectedItems );

		var obj = ( !CustomInputConfig ? getInputConfig( InputName ) :
			CustomInputConfig( InputName ) );

		function getItems( value ) {
			var values = Object.keys( obj );
			if ( value ) {
				var valueLowerCase = value.toLowerCase();
				values = values.filter(
					( x ) => x.toLowerCase().includes( valueLowerCase )
				);
			}

			return VisualDataFunctions.sort( values ).map( ( x ) => {
				var menuOptionWidget = new OO.ui.MenuOptionWidget( {
					data: x,
					label: x,
					selected: inArray( x, self.selectedItems )
				} );

				return menuOptionWidget;
			} );
		}

		var searchWidget = new OO.ui.SearchWidget( {
			// id: 'visualdata-import-search-widget'
		} );

		searchWidget.results.addItems( getItems() );

		// searchWidget.getResults() is a SelectWidget
		// https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui.SelectWidget
		var searchWidgetResults = searchWidget.getResults();
		searchWidgetResults.multiselect = true;

		// this.searchWidgetResults = searchWidgetResults;

		// we don't rely anymore on searchWidgetResults.findSelectedItems()
		// to handle non-visible highlighted items
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
			modes: 'edit',
			label: mw.msg( 'visualdata-jsmodule-dialog-done' ),
			flags: [ 'primary', 'progressive' ]
		},
		{
			// modes: "edit",
			label: mw.msg( 'visualdata-jsmodule-dialog-cancel' ),
			flags: [ 'safe', 'close' ]
		}
	];
	ProcessDialogSearch.prototype.getActionProcess = function ( action ) {
		var dialog = this;

		if ( action === 'save' ) {
			// var items = dialog.searchWidgetResults.findSelectedItems();
			// var selectedItems = items.map( ( x ) => x.data );

			// remove unselected properties
			for ( var key in SelectedItems ) {
				if ( !inArray( key, dialog.selectedItems ) ) {
					delete SelectedItems[ key ];
					delete Model[ key ];
				}
			}

			// add new properties
			for ( var key of dialog.selectedItems ) {
				if ( !( key in SelectedItems ) ) {
					SelectedItems[ key ] = undefined;
				}
			}

			panelLayout.populateFieldset();
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

	function openSearchDialog() {
		processDialogSearch = new ProcessDialogSearch( {
			size: 'medium',
			classes: [ 'visualdata-search-dialog' ]
			// data: { label: label }
		} );

		WindowManager.newWindow( processDialogSearch );
	}

	function PanelLayout( config ) {
		PanelLayout.super.call( this, config );

		/*
		this.messageWidget = new OO.ui.MessageWidget({
			type: "notice",
			label: new OO.ui.HtmlSnippet(
				mw.msg("visualdata-jsmodule-visualdata-no-properties")
			),
		});
*/

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
		var obj = ( !CustomInputConfig ? getInputConfig( InputName ) :
			CustomInputConfig( InputName ) );

		for ( var i in obj ) {
			if ( !( i in SelectedItems ) ) {
				continue;
			}

			var inputName;
			var config = {};
			var type = obj[ i ][ 0 ];
			switch ( type ) {
				case 'boolean':
					inputName = 'OO.ui.ToggleSwitchWidget';
					break;
				case 'string':
					inputName = 'OO.ui.TextInputWidget';
					break;
				case 'number':
				case 'integer':
					inputName = 'OO.ui.NumberInputWidget';
					config.type = 'number';
					break;
				case 'date':
					inputName = 'mw.widgets.DateInputWidget';
					break;
				case 'array':
					inputName = 'OO.ui.TagMultiselectWidget';
					break;

				// not implemented
				case 'object':
					continue;

				default:
					inputName = 'OO.ui.TextInputWidget';
			}

			if ( typeof SelectedItems[ i ] !== 'undefined' ) {
				config.value = SelectedItems[ i ];
			}

			var inputWidget = VisualDataFunctions.inputInstanceFromName(
				inputName,
				config
			);
			Model[ i ] = { input: inputWidget, type: type };

			items.push(
				new OO.ui.FieldLayout( inputWidget, {
					label: i,
					align: 'top',
					help: new OO.ui.HtmlSnippet( obj[ i ][ 1 ] ),
					helpInline: true,
					classes: []
				} )
			);
		}

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

	function createActionToolbar() {
		// see https://gerrit.wikimedia.org/r/plugins/gitiles/oojs/ui/+/refs/tags/v0.40.4/demos/pages/toolbars.js
		var toolFactory = new OO.ui.ToolFactory();
		var toolGroupFactory = new OO.ui.ToolGroupFactory();

		var toolbar = new OO.ui.Toolbar( toolFactory, toolGroupFactory, {
			actions: false
		} );

		var onSelect = function () {
			window.open( HelpUrl, '_blank' ).focus();
			this.setActive( false );
		};

		var toolGroup = [
			{
				name: 'help-button',
				icon: 'helpNotice',
				// title: mw.msg( 'visualdata-jsmodule-forms-toolbars-help-button' ),
				onSelect: onSelect
			}
		];

		// @see https://www.mediawiki.org/wiki/OOUI/Toolbars
		toolbar.setup( [
			{
				type: 'bar',
				include: [ 'help-button' ]
			}
		] );

		VisualDataFunctions.createToolGroup(
			toolFactory,
			'selectSwitch',
			toolGroup
		);

		return toolbar;
	}

	ProcessDialog.prototype.initialize = function () {
		ProcessDialog.super.prototype.initialize.apply( this, arguments );
		var toolbar = createToolbarB();

		if ( HelpUrl ) {
			var actionToolbar = createActionToolbar();
			toolbar.$actions.append( actionToolbar.$element );
		}

		panelLayout = new PanelLayout( {
			expanded: false,
			padded: true,
			classes: [ 'visualdata-forms-fields-contentframe' ],
			data: {}
		} );

		var frameA = new OO.ui.PanelLayout( {
			$content: [ toolbar.$element, panelLayout.$element ],
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
				var obj = {};
				for ( var i in Model ) {
					obj[ i ] = VisualDataFunctions.castType(
						Model[ i ].input.getValue(),
						Model[ i ].type
					);
				}

				Callback.setValue( obj );
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

	function openDialog( callback, inputName, helpUrl, customInputConfig ) {
		Model = {};
		Callback = callback;
		SelectedItems = callback.getValue();
		HelpUrl = helpUrl;

		// @TODO update once a form key -> value is used
		// for the options widget of available inputs dropdown
		InputName = inputName.split( / / )[ 0 ];
		CustomInputConfig = customInputConfig;

		var processDialog = new ProcessDialog( {
			size: 'large'
		} );

		WindowManager.newWindow( processDialog, {
			title:
				mw.msg(
					// The following messages are used here:
					// * visualdata-jsmodule-manageproperties-define-property
					// * visualdata-jsmodule-manageproperties-define-property - [name]
					'visualdata-jsmodule-inputconfig-dialog-label'
				) + ( inputName ? ' - ' + inputName : '' )
		} );
	}

	return {
		openDialog
	};
};
