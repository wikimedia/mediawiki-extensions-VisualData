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
 * @copyright Copyright © 2024, https://wikisphere.org
 */

/* eslint-disable no-unused-vars */

( function () {
	// eslint-disable-next-line no-implicit-globals
	VisualDataMaptiler = function ( config ) {
		this.scripts = [
			'https://cdn.maptiler.com/maptiler-sdk-js/v1.2.0/maptiler-sdk.umd.min.js',
			'https://cdn.maptiler.com/maptiler-geocoding-control/v1.2.0/maptilersdk.umd.js'
		];
	};

	VisualDataMaptiler.prototype.load = function () {
		VisualDataFunctions.loadScripts( this.scripts );
	};

	VisualDataMaptiler.prototype.initialize = async function ( $element, data ) {
		var self = this;

		// only load scripts
		if ( !$element.parent().is( ':visible' ) ) {
			VisualDataFunctions.loadScripts( this.scripts );
			return Promise.reject( 'Maptiler element not visible' );
		}

		// *** prevents ajv error "Maximum call stack size exceeded"
		var config = VisualDataFunctions.deepCopy( data.schema.wiki );
		var latInput = data.model.properties.latitude.input;
		var lngInput = data.model.properties.longitude.input;
		var zoomInput = data.model.properties.zoom.input;
		var mapId = 'visualdata-maptiler-map-' + data.path;

		if ( $( '#' + jQuery.escapeSelector( mapId ) ).length ) {
			return Promise.resolve();
		}

		return new Promise( ( resolve, reject ) => {
			VisualDataFunctions.loadScripts( this.scripts, function ( e ) {
				maptilersdk.config.apiKey = mw.config.get( 'visualdata-maptiler-apikey' );
				var $container = $( '<div style="width:100%;height:400px" id="' + mapId + '" />' );
				$element.append( $container );

				config[ 'maptiler-map-config' ].container = mapId;
				config[ 'maptiler-map-config' ].style = maptilersdk.MapStyle.HYBRID;

				var center = [ parseFloat( lngInput.getValue() ), parseFloat( latInput.getValue() ) ];

				var isValidCenter = !VisualDataFunctions.isNaN( center[ 0 ] ) && !VisualDataFunctions.isNaN( center[ 1 ] );

				if ( isValidCenter ) {
					config[ 'maptiler-map-config' ].center = center;
					config[ 'maptiler-map-config' ].zoom = parseInt( zoomInput.getValue() );
					config[ 'maptiler-map-config' ].geolocate = false;

				} else {
					if ( !( 'geolocate' in config[ 'maptiler-map-config' ] ) ) {
						config[ 'maptiler-map-config' ].geolocate = true;
					}
				}

				const map = ( window.map = new maptilersdk.Map( config[ 'maptiler-map-config' ] ) );
				config[ 'maptiler-map-config' ].marker = false;

				var marker;

				if ( config[ 'reverse-geocoding' ] ) {
					const gc = new maptilersdkMaptilerGeocoder.GeocodingControl( config[ 'maptiler-map-config' ] );

					map.on( 'zoomend', ( res ) => {
						// console.log('zoomend:', res);
						zoomInput.setValue( map.getZoom() );
					} );

					// https://docs.maptiler.com/sdk-js/modules/geocoding/api/api-reference/#event:featuresListed
					gc.addEventListener( 'response', ( res ) => {
						// console.log("response:", res);
					} );

					gc.addEventListener( 'select', ( res ) => {
						// console.log("select:", res );
						if ( res.detail ) {
							marker.setLngLat( res.detail.center );
						}
					} );

					gc.addEventListener( 'pick', ( res ) => {
						// console.log("pick:", res );
					} );

					gc.addEventListener( 'featuresListed', ( res ) => {
						// console.log("featuresListed:", res);
					} );

					gc.addEventListener( 'featuresMarked', ( res ) => {
						// console.log("featuresMarked:", res);
					} );

					map.addControl( gc, 'top-left' );
				}

				function onDragEnd() {
					var lngLat = marker.getLngLat();
					setTimeout( function () {
						lngInput.setValue( lngLat.lng );
						latInput.setValue( lngLat.lat );
						zoomInput.setValue( map.getZoom() );
					}, 100 );
				}

				map.on( 'load', function () {
					if ( !marker ) {
						marker = new maptilersdk.Marker( {
							draggable: true
						} )
							.setLngLat( map.getCenter() )
							.addTo( map );

						marker.on( 'dragend', onDragEnd );
					}
				} );

				if ( isValidCenter ) {
					marker = new maptilersdk.Marker( {
						draggable: true
					} )
						.setLngLat( center )
						.addTo( map );

					marker.on( 'dragend', onDragEnd );
				}

				// update marker
				data.model.properties.latitude.input.on( 'change', function ( value ) {
					marker.setLngLat( [ lngInput.getValue(), value ] );
				} );
				data.model.properties.longitude.input.on( 'change', function ( value ) {
					marker.setLngLat( [ value, latInput.getValue() ] );
				} );

				resolve();
			} );
		} );
	};

}() );
