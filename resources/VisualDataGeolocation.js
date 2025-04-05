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
 * @copyright Copyright ©2024, https://wikisphere.org
 */

/* eslint-disable max-len */
// eslint-disable-next-line no-unused-vars
const VisualDataGeolocation = function ( phpConfig, windowManager ) {
	// eslint-disable-next-line no-unused-vars
	var Config = phpConfig;
	var WindowManager = windowManager;
	var ProcessDialog;
	var Model;
	var ParentObj;
	var panelLayout;
	var CurrentKey;
	var Callback;
	var VisualDataInputConfigInst = new VisualDataInputConfig(
		phpConfig,
		windowManager
	);

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

	function getInputConfig( inputName ) {
		switch ( inputName ) {
			// https://docs.maptiler.com/sdk-js/api/map/
			case 'maptiler-map':
				return {
					container: [ 'string', 'The HTML element in which SDK JS will render the map, or the element\'s string id. The specified element must have no children.' ],
					style: [
						'(ReferenceMapStyle | MapStyleVariant | string | StyleSpecification)?',
						'The map\'s style. This must be one of: ReferenceMapStyle (e.g., MapStyle.STREETS), MapStyleVariant (e.g., MapStyle.STREETS.DARK), MapTIler Style ID (e.g., “streets-v2”), UUID of custom style, a JSON object conforming to the schema described in the GL Style Specification, or a URL to such JSON.'
					],
					language: [ 'string', 'Define the language of the map. This can be done directly with a language ISO code (e.g., "en") or with a built-in Languages shorthand (e.g., Language.ENGLISH). This applies only for the map instance, supersedes the config.primaryLanguage.' ],
					// apiKey: ['string', 'Define the MapTiler Cloud API key to be used. This is equivalent to setting config.apiKey and will overwrite it.'],
					center: [ 'array', 'The initial geographical centerpoint of the map. If center is not specified in the constructor options, SDK JS will look for it in the map\'s style object. If it is not specified in the style, it will default to [0, 0]. Note: SDK JS uses longitude, latitude coordinate order (as opposed to latitude, longitude) to match GeoJSON.' ],
					zoom: [ 'number', 'The initial zoom level of the map. If zoom is not specified in the constructor options, SDK JS will look for it in the map\'s style object. If it is not specified in the style, it will default to 0.' ],
					bearing: [ 'number', 'The initial bearing (rotation) of the map, measured in degrees counter-clockwise from north. If bearing is not specified in the constructor options, SDK JS will look for it in the map\'s style object. If it is not specified in the style, it will default to 0.' ],
					pitch: [ 'number', 'The initial pitch (tilt) of the map, measured in degrees away from the plane of the screen (0-85). If pitch is not specified in the constructor options, SDK JS will look for it in the map\'s style object. If it is not specified in the style, it will default to 0. Values greater than 60 degrees are experimental and may result in rendering issues.' ],
					// bounds: ['LngLatBoundsLike?', 'The initial bounds of the map. If bounds is specified, it overrides center and zoom constructor options.'],
					hash: [ 'boolean', 'If true, the map\'s position (zoom, center latitude, center longitude, bearing, and pitch) will be synced with the hash fragment of the page\'s URL. An additional string may optionally be provided to indicate a parameter-styled hash.' ],
					terrain: [ 'boolean', 'If true, the map loads a 3D terrain, based on a MapTiler "raster-dem" source.' ],
					terrainExaggeration: [ 'number', '3D terrain exaggeration factor.' ],
					geolocate: [ 'boolean', 'Center map on the visitor\'s location by using the IP geolocation API.' ],
					attributionControl: [ 'boolean', 'If true, an AttributionControl will be added to the map.' ],
					navigationControl: [ 'string', 'If true, a NavigationControl will be added to the map. Valid options are top-left, top-right, bottom-left, bottom-right.' ],
					terrainControl: [ 'string', 'If true, a TerrainControl will be added to the map. Valid options are top-left, top-right, bottom-left, bottom-right.' ],
					geolocateControl: [ 'string', 'If true, a GeolocateControl will be added to the map. Valid options are top-left, top-right, bottom-left, bottom-right.' ],
					scaleControl: [ 'string', 'If true, a ScaleControl will be added to the map. Valid options are top-left, top-right, bottom-left, bottom-right.' ],
					fullscreenControl: [ 'string', 'If true, a FullscreenControl will be added to the map. Valid options are top-left, top-right, bottom-left, bottom-right.' ],
					minimap: [ 'string', 'If true, a MaptilerMinimapControl will be added to the map. Valid options are top-left, top-right, bottom-left, bottom-right, or MinimapOptionsInput.' ],
					minZoom: [ 'number', 'The minimum zoom level of the map (0-24).' ],
					maxZoom: [ 'number', 'The maximum zoom level of the map (0-24).' ],
					minPitch: [ 'number', 'The minimum pitch of the map (0-85). Values greater than 60 degrees are experimental.' ],
					maxPitch: [ 'number', 'The maximum pitch of the map (0-85). Values greater than 60 degrees are experimental.' ],
					// maxBounds: ['LngLatBoundsLike?', 'If set, the map will be constrained to the given bounds.'],
					interactive: [ 'boolean', 'If false, no mouse, touch, or keyboard listeners will be attached to the map.' ],
					bearingSnap: [ 'number', 'The threshold, measured in degrees, that determines when the map\'s bearing will snap to north.' ],
					pitchWithRotate: [ 'boolean', 'If false, the map\'s pitch control with "drag to rotate" interaction will be disabled.' ],
					clickTolerance: [ 'number', 'The max number of pixels a user can shift the mouse pointer during a click for it to be considered a valid click.' ],
					customAttribution: [ 'array', 'String or strings to show in an AttributionControl. Only applicable if options.attributionControl is true.' ],
					maptilerLogo: [ 'boolean', 'If true, the MapTiler logo will be shown. false will only work on premium accounts' ],
					logoPosition: [ 'string', 'A string representing the position of the MapTiler wordmark on the map. Valid options are top-left, top-right, bottom-left, bottom-right.' ],
					failIfMajorPerformanceCaveat: [ 'boolean', 'If true, map creation will fail if the performance of SDK JS would be dramatically worse than expected.' ],
					preserveDrawingBuffer: [ 'boolean', 'If true, the map\'s canvas can be exported to a PNG using map.getCanvas().toDataURL().' ],
					antialias: [ 'boolean', 'If true, the gl context will be created with MSAA antialiasing.' ],
					refreshExpiredTiles: [ 'boolean', 'If false, the map won\'t attempt to re-request tiles once they expire per their HTTP cacheControl / expires headers.' ],
					scrollZoom: [ 'boolean', 'If true, the "scroll to zoom" interaction is enabled. An Object value is passed as options to ScrollZoomHandler#enable.' ],
					boxZoom: [ 'boolean', 'If true, the "box zoom" interaction is enabled.' ],
					dragRotate: [ 'boolean', 'If true, the "drag to rotate" interaction is enabled.' ],
					dragPan: [ 'boolean', 'If true, the "drag to pan" interaction is enabled. An Object value is passed as options to DragPanHandler#enable.' ],
					keyboard: [ 'boolean', 'If true, keyboard shortcuts are enabled.' ],
					doubleClickZoom: [ 'boolean', 'If true, the "double click to zoom" interaction is enabled.' ],
					touchZoomRotate: [ 'boolean', 'If true, the "pinch to rotate and zoom" interaction is enabled. An Object value is passed as options to TouchZoomRotateHandler#enable.' ],
					touchPitch: [ 'boolean', 'If true, the "drag to pitch" interaction is enabled. An Object value is passed as options to TouchPitchHandler#enable.' ],
					cooperativeGestures: [ 'boolean', 'If true or set to an options object, map is only accessible on desktop while holding Command/Ctrl and only accessible on mobile with two fingers.' ],
					trackResize: [ 'boolean', 'If true, the map will automatically resize when the browser window resizes.' ],
					// fitBoundsOptions: ['Object?', 'A Map#fitBounds options object to use only when fitting the initial bounds provided above.'],
					renderWorldCopies: [ 'boolean', 'If true, multiple copies of the world will be rendered side by side beyond -180 and 180 degrees longitude. If set to false: When the map is zoomed out far enough that a single representation of the world does not fill the map\'s entire container, there will be blank space beyond 180 and -180 degrees longitude. Features that cross 180 and -180 degrees longitude will be cut in two (with one portion on the right edge of the map and the other on the left edge of the map) at every zoom level.' ],
					maxTileCacheSize: [ 'number', 'The maximum number of tiles stored in the tile cache for a given source. If omitted, the cache will be dynamically sized based on the current viewport.' ],
					localIdeographFontFamily: [ 'string', 'Defines a CSS font-family for locally overriding generation of glyphs in the \'CJK Unified Ideographs\', \'Hiragana\', \'Katakana\' and \'Hangul Syllables\' ranges. Set to false, to enable font settings from the map\'s style for these glyph ranges.' ],
					// transformRequest: ['RequestTransformFunction', 'A callback run before the Map makes a request for an external URL. The callback can be used to modify the URL, set headers, or set the credentials property for cross-origin requests. Expected to return an object with a url property and optionally headers and credentials properties.'],
					collectResourceTiming: [ 'boolean', 'If true, Resource Timing API information will be collected for requests made by GeoJSON and Vector Tile web workers. Information will be returned in a resourceTiming property of relevant data events.' ],
					fadeDuration: [ 'number', 'Controls the duration of the fade-in/fade-out animation for label collisions, in milliseconds. This setting affects all symbol layers.' ],
					crossSourceCollisions: [ 'boolean', 'If true, symbols from multiple sources can collide with each other during collision detection. If false, collision detection is run separately for the symbols in each source.' ],
					// locale: ['Object', 'A patch to apply to the default localization table for UI strings. The locale object maps namespaced UI string IDs to translated strings in the target language. The object may specify all UI strings or only a subset of strings.'],
					pixelRatio: [ 'number', 'The pixel ratio. The canvas\' width attribute will be container.clientWidth * pixelRatio and its height attribute will be container.clientHeight * pixelRatio. Defaults to devicePixelRatio if not specified.' ]
				};

			// https://docs.maptiler.com/sdk-js/modules/geocoding/api/api-reference/
			case 'maptiler-geocoding':
				return {
					// apiKey: ['string?', 'Maptiler API key. Not needed if used with MapTiler SDK.'],
					// maplibregl: ['MapLibreGL?', 'A MapLibre GL JS instance to use when creating Markers. Used if options.marker is true with MapLibre GL JS library. If not provided, it will be autodetected. Not needed if used with MapTiler SDK.'],
					debounceSearch: [ 'number', 'Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box.' ],
					// proximity: ['ProximityRule[] | null | undefined?', 'Search results closer to the proximity point will be given higher priority. Set to `undefined` or `null` to disable proximity.'],
					placeholder: [ 'string', 'Override the default placeholder attribute value.' ],
					errorMessage: [ 'string', 'Override the default error message.' ],
					noResultsMessage: [ 'string', 'Override the default message if no results are found.' ],
					trackProximity: [ 'boolean', 'If true, the geocoder proximity will automatically update based on the map view.' ],
					minLength: [ 'number', 'Minimum number of characters to enter for results to show.' ],
					// bbox: ['[number, number, number, number]?', 'A bounding box argument in the format [minX, minY, maxX, maxY]. Search results will be limited to the bounding box.'],
					language: [ 'string', 'Specify the language(s) to use for response text and query result weighting.' ],
					showResultsWhileTyping: [ 'boolean', 'If false, search will only occur on enter key press. If true, indicates that the Geocoder will search on the input box being updated above the minLength option.' ],
					marker: [ 'boolean', 'If true, a Marker will be added to the map at the location of the user-selected result using a default set of Marker options. If the value is an object, the marker will be constructed using these options. If false, no marker will be added to the map. Requires that options.maplibregl also be set.' ],
					showResultMarkers: [ 'booleans', 'If true, a Marker will be added to the map at the location of the top results for the query. If the value is an object, the marker will be constructed using these options. If false, no marker will be added to the map. Requires that options.maplibregl also be set.' ],
					zoom: [ 'number', 'On geocoded result, what zoom level should the map animate to when a bbox isn\'t found in the response.' ],
					flyTo: [ 'boolean', 'If false, animating the map to a selected result is disabled. If true, animating the map will use the default animation parameters. If an object, it will be passed as options to the map flyTo or fitBounds method providing control over the animation of the transition.' ],
					collapsed: [ 'boolean?', 'If true, the geocoder control will collapse until hovered or in focus.' ],
					clearOnBlur: [ 'boolean', 'If true, the geocoder control will clear its value when the input blurs.' ],
					// filter: ['(feature: Feature) => boolean?', 'A function which accepts a Feature in the Carmen GeoJSON format to filter out results from the Geocoding API response before they are included in the suggestions list.'],
					class: [ 'string', 'Class of the root element.' ],
					enableReverse: [ 'boolean', 'Set to true to enable reverse geocoding button with title. Set to "always" to reverse geocoding be always active.' ],
					reverseButtonTitle: [ 'string', 'Reverse toggle button title.' ],
					reverseActive: [ 'boolean', 'Set to true to programmatically toggle reverse mode. Useful only if enableReverse is true.' ],
					clearButtonTitle: [ 'string', 'Clear button title.' ],
					showFullGeometry: [ 'boolean', 'Set to true to show the full feature geometry of the chosen result. Otherwise, only the marker will be shown.' ],
					// fullGeometryStyle: ['Object?', 'Style of the full feature geometry.'],
					fuzzyMatch: [ 'boolean', 'Set to false to disable fuzzy search.' ],
					limit: [ 'number', 'Maximum number of results to show.' ],
					country: [ 'array', 'Limit search to specified country(ies).' ],
					types: [ 'array', 'Filter of feature types to return.' ],
					excludeTypes: [ 'boolean', 'Set to true to use all available feature types except those mentioned in types.' ],
					apiUrl: [ 'string', 'Geocoding API URL.' ],
					// fetchParameters: ['RequestInit?', 'Extra fetch parameters.'],
					iconsBaseUrl: [ 'string', 'Base URL for POI icons.' ],
					// adjustUrlQuery: ['(sp: URLSearchParams) => void', 'Function to adjust URL search parameters.'],
					selectFirst: [ 'boolean', 'Automatically select the first feature from the result list.' ],
					flyToSelected: [ 'boolean', 'Fly to the selected feature from the result list.' ],
					markerOnSelected: [ 'boolean', 'Show a marker on the selected feature from the result list.' ]
				};
		}
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

		var nameInputField = new OO.ui.FieldLayout( nameInput, {
			label: mw.msg( 'visualdata-jsmodule-geolocation-name' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( nameInputField );

		var labelInput = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'label' )
		} );

		Model.label = nameInput;
		var labelInputField = new OO.ui.FieldLayout( labelInput, {
			label: mw.msg( 'visualdata-jsmodule-formfield-label' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( labelInputField );

		var helpMessageInput = new OO.ui.MultilineTextInputWidget( {
			autosize: true,
			rows: 2,
			value: getPropertyValue( 'help-message' )
		} );

		Model[ 'help-message' ] = helpMessageInput;

		var helpMessageInputField = new OO.ui.FieldLayout( helpMessageInput, {
			label: mw.msg( 'visualdata-jsmodule-formfield-help-message' ),
			helpInline: true,
			align: 'top',
			help: mw.msg( 'visualdata-jsmodule-formfield-help-message-help' )
		} );

		items.push( helpMessageInputField );

		var hasApiKey = mw.config.get( 'visualdata-maptiler-apikey' );

		if ( hasApiKey ) {
			var coordinatesButton = new OO.ui.ToggleButtonWidget( {
				label: mw.msg( 'visualdata-jsmodule-geolocation-coordinates' ),
				value: getPropertyValue( 'coordinates' )
			} );

			Model.coordinates = coordinatesButton;

			var mapButton = new OO.ui.ToggleButtonWidget( {
				label: mw.msg( 'visualdata-jsmodule-geolocation-map' ),
				value: getPropertyValue( 'map' )
			} );

			Model.map = mapButton;

			var reverseGeocodingButton = new OO.ui.ToggleButtonWidget( {
				label: mw.msg( 'visualdata-jsmodule-geolocation-reverse-geocoding' ),
				value: getPropertyValue( 'reverse-geocoding' )
			} );

			Model[ 'reverse-geocoding' ] = reverseGeocodingButton;

			var layoutInput = new OO.ui.ButtonGroupWidget( {
				items: [ coordinatesButton, mapButton, reverseGeocodingButton ]
			} );

			items.push(
				new OO.ui.FieldLayout( layoutInput, {
					label: mw.msg( 'visualdata-jsmodule-geolocation-layout' ),
					helpInline: true,
					align: 'top'
				} )
			);

			var maptilerMapConfigButton = new OO.ui.ButtonWidget( {
				label: mw.msg( 'visualdata-jsmodule-geolocation-maptiler-map-button' ),
				icon: 'settings',
				flags: []
			} );

			var defaultMaptilerMapConfig = getPropertyValue( 'maptiler-map-config' ) || {};

			Model[ 'maptiler-map-config' ] = new VisualDataFunctions.MockupOOUIClass(
				defaultMaptilerMapConfig
			);

			maptilerMapConfigButton.on( 'click', function () {
				VisualDataInputConfigInst.openDialog(
					Model[ 'maptiler-map-config' ],
					'maptiler-map',
					'https://docs.maptiler.com/sdk-js/api/map/',
					getInputConfig
				);
			} );

			var maptilerMapConfigButtonField = new OO.ui.FieldLayout( maptilerMapConfigButton, {
				label: mw.msg( 'visualdata-jsmodule-geolocation-maptiler-map' ),
				helpInline: true,
				align: 'top',
				help: new OO.ui.HtmlSnippet( mw.msg( 'visualdata-jsmodule-geolocation-maptiler-map-help' ) )
			} );

			items.push( maptilerMapConfigButtonField );

			var maptilerGeocodingConfigButton = new OO.ui.ButtonWidget( {
				label: mw.msg( 'visualdata-jsmodule-geolocation-maptiler-geocoding-button' ),
				icon: 'settings',
				flags: []
			} );

			var defaultMaptilerGeocodingConfig = getPropertyValue( 'maptiler-geocoding-config' ) || {};

			Model[ 'maptiler-geocoding-config' ] = new VisualDataFunctions.MockupOOUIClass(
				defaultMaptilerGeocodingConfig
			);

			maptilerGeocodingConfigButton.on( 'click', function () {
				VisualDataInputConfigInst.openDialog(
					Model[ 'maptiler-geocoding-config' ],
					'maptiler-geocoding',
					'https://docs.maptiler.com/sdk-js/modules/geocoding/api/api-reference/',
					getInputConfig
				);
			} );

			var maptilerGeocodingConfigButtonField = new OO.ui.FieldLayout( maptilerGeocodingConfigButton, {
				label: mw.msg( 'visualdata-jsmodule-geolocation-maptiler-geocoding' ),
				helpInline: true,
				help: new OO.ui.HtmlSnippet( mw.msg( 'visualdata-jsmodule-geolocation-maptiler-geocoding-help' ) ),
				align: 'top'
			} );

			items.push( maptilerGeocodingConfigButtonField );

		} else {
			var messageWidget = new OO.ui.MessageWidget( {
				type: 'info',
				label: new OO.ui.HtmlSnippet(
					mw.msg(
						'visualdata-jsmodule-geolocation-message'
					) +
					'<img style="display:block;width: 240px;position: relative; left:-26px;padding: 12px;" src="https://media.maptiler.com/old/mediakit/logo/maptiler-logo.png" />'
				),
				classes: [ 'VisualDataFormFieldMessage' ]
			} );

			items.push( messageWidget );

			Model.coordinates = new VisualDataFunctions.MockupOOUIClass(
				true
			);
			Model.map = new VisualDataFunctions.MockupOOUIClass(
				false
			);
			Model[ 'reverse-geocoding' ] = new VisualDataFunctions.MockupOOUIClass(
				false
			);
		}

		var requiredInput = new OO.ui.ToggleSwitchWidget( {
			value: !!getPropertyValue( 'required' )
		} );

		Model.required = requiredInput;

		var requiredInputLabelField = new OO.ui.FieldLayout( requiredInput, {
			label: mw.msg( 'visualdata-jsmodule-geolocation-formfield-required' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( requiredInputLabelField );

		var latitudeInputLabel = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'latitude-input-label' ) || 'latitude'
		} );

		Model[ 'latitude-input-label' ] = latitudeInputLabel;

		var latitudeInputLabelField = new OO.ui.FieldLayout( latitudeInputLabel, {
			label: mw.msg( 'visualdata-jsmodule-geolocation-latitude-input-label' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( latitudeInputLabelField );

		var latitudeInputHelp = new OO.ui.MultilineTextInputWidget( {
			autosize: true,
			rows: 2,
			value: getPropertyValue( 'latitude-input-help' )
		} );

		Model[ 'latitude-input-help' ] = latitudeInputHelp;

		var latitudeInputHelpField = new OO.ui.FieldLayout( latitudeInputHelp, {
			label: mw.msg( 'visualdata-jsmodule-geolocation-latitude-input-label-help' ),
			helpInline: true,
			align: 'top',
			help: mw.msg( 'visualdata-jsmodule-formfield-help-message-help' )
		} );

		items.push( latitudeInputHelpField );

		var longitudeInputLabel = new OO.ui.TextInputWidget( {
			value: getPropertyValue( 'longitude-input-label' ) || 'longitude'
		} );

		Model[ 'longitude-input-label' ] = longitudeInputLabel;

		var longitudeInputLabelField = new OO.ui.FieldLayout( longitudeInputLabel, {
			label: mw.msg( 'visualdata-jsmodule-geolocation-longitude-input-label' ),
			helpInline: true,
			align: 'top'
		} );

		items.push( longitudeInputLabelField );

		var longitudeInputHelp = new OO.ui.MultilineTextInputWidget( {
			autosize: true,
			rows: 2,
			value: getPropertyValue( 'longitude-input-help' )
		} );

		Model[ 'longitude-input-help' ] = longitudeInputHelp;

		var longitudeInputHelpField = new OO.ui.FieldLayout( longitudeInputHelp, {
			label: mw.msg( 'visualdata-jsmodule-geolocation-longitude-input-label-help' ),
			helpInline: true,
			align: 'top',
			help: mw.msg( 'visualdata-jsmodule-formfield-help-message-help' )
		} );

		items.push( longitudeInputHelpField );

		items = items.filter( function ( x ) {
			return !( 'items' in x ) || x.items.length;
		} );

		this.isEmpty = !items.length;

		this.fieldset.addItems( items );

		if ( hasApiKey ) {

			// eslint-disable-next-line no-inner-declarations
			function setCoordinatesVisibility( value ) {
				latitudeInputLabelField.toggle( value );
				latitudeInputHelpField.toggle( value );
				longitudeInputLabelField.toggle( value );
				longitudeInputHelpField.toggle( value );
			}

			coordinatesButton.on( 'change', setCoordinatesVisibility );

			// eslint-disable-next-line no-inner-declarations
			function setMapVisibility( value ) {
				maptilerMapConfigButtonField.toggle( value );
				if ( value === false ) {
					reverseGeocodingButton.setValue( false );
				}
			}

			// eslint-disable-next-line no-inner-declarations
			function setReverseGeocodingVisibility( value ) {
				maptilerGeocodingConfigButtonField.toggle( value );
				if ( value === true ) {
					mapButton.setValue( true );
				}
			}

			reverseGeocodingButton.on( 'change', setReverseGeocodingVisibility );

			mapButton.on( 'change', setMapVisibility );

			setCoordinatesVisibility( getPropertyValue( 'coordinates' ) );
			setMapVisibility( getPropertyValue( 'map' ) );
			setReverseGeocodingVisibility( getPropertyValue( 'reverse-geocoding' ) );
		}
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
				var obj = { type: 'geolocation' };

				for ( var i in Model ) {
					obj[ i ] = VisualDataSchemas.getWidgetValue( Model[ i ] );
				}

				var objName = obj.name;
				var alert = null;
				if ( objName === '' ) {
					alert = mw.msg( 'visualdata-jsmodule-schemas-alert-noname' );
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

		// *** place here properties to copy
		if ( fieldName in parentObj && 'uuid' in parentObj[ fieldName ].wiki ) {
			Model.uuid = new VisualDataFunctions.MockupOOUIClass(
				parentObj[ fieldName ].wiki.uuid );
		}

		ParentObj = parentObj;

		CurrentKey =
			fieldName ||
			VisualDataFunctions.createNewKey(
				parentObj,
				mw.msg( 'visualdata-jsmodule-geolocation-newlabel' )
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
				'visualdata-jsmodule-formfield-define-geolocation'
			) + ( fieldName ? ' - ' + fieldName : '' ) }
		);
	}

	return {
		openDialog
	};
};
