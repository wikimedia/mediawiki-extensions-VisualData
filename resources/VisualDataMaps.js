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
 * @copyright Copyright © 2025, https://wikisphere.org
 */

/* eslint-disable no-unused-vars */

const VisualDataMaps = function ( el ) {};

$( function () {
	// @see https://leafletjs.com/reference.html#popup-option
	// @see view-source:https://leaflet.github.io/Leaflet.markercluster/example/marker-clustering-realworld.10000.html

	function init( $el ) {
		var data = $el.data();
		var params = data.params;
		var json = data.json;

		var map = L.map( $el.get( 0 ), params.map );

		var tiles = L.tileLayer(
			'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			params.tileLayer
		).addTo( map );

		var markers = ( !params.markerCluster ?
			L.layerGroup() :
			L.markerClusterGroup( params.markerClusterGroup ) );

		// for some reason the images aren't loaded
		// relatively from leaflet.js
		var mw_extensionAssetsPath = mw.config.get( 'wgExtensionAssetsPath' );
		var basePath = mw_extensionAssetsPath + '/VisualData/resources/Leaflet/images/';

		for ( var key of [ 'iconUrl', 'iconRetinaUrl', 'shadowUrl' ] ) {
			params.icon[ key ] = basePath + params.icon[ key ];
		}

		var markersArr = [ ];
		for ( var value of json ) {
			var markerOptions = params.marker;

			markerOptions.icon = L.icon( params.icon );

			if ( params.markerTooltip && value.name ) {
				markerOptions.title = value.name;
			}

			var marker = L.marker(
				L.latLng( value.latitude, value.longitude ),
				markerOptions
			);

			// eslint-disable-next-line no-underscore-dangle
			if ( value.name || value.popup || value._popup ) {
				var customPopup = L.popup( params.popup );
				// eslint-disable-next-line no-underscore-dangle
				customPopup.setContent( value.popup || value._popup || value.name );
				marker.bindPopup( customPopup );
			}

			markers.addLayer( marker );
			markersArr.push( marker );
		}

		map.addLayer( markers );

		if ( markersArr.length > 1 ) {
			var featureGroup = L.featureGroup( markersArr );
			map.fitBounds( featureGroup.getBounds() );
		}
	}

	$( '.visualdata-map' ).each( function () {
		init( $( this ) );
	} );
} );
