<?php

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
 * along with VisualData.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @ingroup extensions
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright ©2025, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use Linker;
use MediaWiki\Extension\VisualData\Aliases\Html as HtmlClass;
use MediaWiki\Extension\VisualData\ResultPrinter;

class MapResultPrinter extends ResultPrinter {

	/** @var array */
	private $json = [];

	/** @var array */
	private $mapProperties;

	/** @var array */
	public static $popupAliases = [
		'_popup',
		'popup',
	];

	/** @var array */
	public static $parameters = [
		// @see https://leafletjs.com/reference.html

		// *** note that we are not using a prexif map-
		// which could be redundant in this case, especially
		// with map. ...

		// @see https://leafletjs.com/reference.html#tilelayer
		'tileLayer.attribution' => [
			'type' => 'string',
			'required' => false,
			'default' => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		],
		'tileLayer.minZoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 0,
		],
		'tileLayer.maxZoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 19,
		],
		'tileLayer.maxNativeZoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 19,
		],
		'tileLayer.minNativeZoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 0,
		],
		'tileLayer.subdomains' => [
			'type' => 'string',
			'required' => false,
			'default' => 'abc',
		],
		'tileLayer.errorTileUrl' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'tileLayer.zoomOffset' => [
			'type' => 'int',
			'required' => false,
			'default' => 0,
		],
		'tileLayer.tms' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'tileLayer.zoomReverse' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'tileLayer.detectRetina' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'tileLayer.crossOrigin' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'tileLayer.referrerPolicy' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'tileLayer.tileSize' => [
			'type' => 'int',
			'required' => false,
			'default' => 256,
		],
		'tileLayer.opacity' => [
			'type' => 'number',
			'required' => false,
			'default' => 1.0,
		],
		'tileLayer.updateWhenIdle' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'tileLayer.updateWhenZooming' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'tileLayer.updateInterval' => [
			'type' => 'int',
			'required' => false,
			'default' => 200,
		],
		'tileLayer.zIndex' => [
			'type' => 'int',
			'required' => false,
			'default' => 1,
		],
		// 'tileLayer.bounds' => [
		// 	'type' => 'string',
		// 	'required' => false,
		// 	'default' => '',
		// ],

		'tileLayer.noWrap' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'tileLayer.pane' => [
			'type' => 'string',
			'required' => false,
			'default' => 'tilePane',
		],
		'tileLayer.className' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'tileLayer.keepBuffer' => [
			'type' => 'int',
			'required' => false,
			'default' => 2,
		],

		// @see https://leafletjs.com/reference.html#map
		// 'map.crs' => [
		// 	'type' => 'string',
		// 	'required' => false,
		// 	'default' => 'L.CRS.EPSG3857',
		// ],
		// 'map.center' => [
		// 	'type' => 'string',
		// 	'required' => false,
		// 	'default' => '',
		// ],
		'map.zoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 13,
		],
		'map.minZoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 0,
		],
		'map.maxZoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 18,
		],
		'map.zoomControl' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.scrollWheelZoom' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.boxZoom' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.doubleClickZoom' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.dragging' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.keyboard' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.fadeAnimation' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.zoomAnimation' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.attributionControl' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'map.trackResize' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],

		'markerClusterGroup.showCoverageOnHover' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'markerClusterGroup.zoomToBoundsOnClick' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'markerClusterGroup.spiderfyOnMaxZoom' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'markerClusterGroup.removeOutsideVisibleBounds' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'markerClusterGroup.animate' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'markerClusterGroup.animateAddingMarkers' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'markerClusterGroup.maxClusterRadius' => [
			'type' => 'int',
			'required' => false,
			'default' => 80,
		],
		'markerClusterGroup.disableClusteringAtZoom' => [
			'type' => 'int',
			'required' => false,
			'default' => 18,
		],
		// 'markers.polygonOptions' => [
		// 	'type' => 'strin',
		// 	'required' => false,
		// 	'default' => '',
		// ],

		'markerClusterGroup.singleMarkerMode' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'markerClusterGroup.spiderfyDistanceMultiplier' => [
			'type' => 'number',
			'required' => false,
			'default' => 1.2,
		],
		'markerClusterGroup.chunkedLoading' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'markerClusterGroup.chunkInterval' => [
			'type' => 'int',
			'required' => false,
			'default' => 200,
		],
		'markerClusterGroup.chunkDelay' => [
			'type' => 'int',
			'required' => false,
			'default' => 50,
		],
		// 'markers.iconCreateFunction' => [
		// 	'type' => 'string',
		// 	'required' => false,
		// 	'default' => '',
		// ],

		// @see https://leafletjs.com/reference.html#icon
		'icon.iconUrl' => [
			'type' => 'string',
			'required' => false,
			'default' => 'marker-icon.png',
		],
		'icon.iconRetinaUrl' => [
			'type' => 'string',
			'required' => false,
			'default' => 'marker-icon-2x.png',
		],
		'icon.iconSize' => [
			'type' => 'string',
			'required' => false,
			'default' => '25, 41',
		],
		'icon.iconAnchor' => [
			'type' => 'string',
			'required' => false,
			'default' => '12, 41',
		],
		'icon.popupAnchor' => [
			'type' => 'string',
			'required' => false,
			'default' => '1, -34',
		],
		'icon.shadowUrl' => [
			'type' => 'string',
			'required' => false,
			'default' => 'marker-shadow.png',
		],
		'icon.shadowSize' => [
			'type' => 'string',
			'required' => false,
			'default' => '41, 41',
		],
		'icon.shadowAnchor' => [
			'type' => 'string',
			'required' => false,
			'default' => '12, 41',
		],

		// @see https://leafletjs.com/reference.html#popup
		'popup.maxWidth' => [
			'type' => 'int',
			'required' => false,
			'default' => 300,
		],
		'popup.minWidth' => [
			'type' => 'int',
			'required' => false,
			'default' => 150,
		],
		'popup.maxHeight' => [
			'type' => 'int',
			'required' => false,
			'default' => 200,
		],
		'popup.autoPan' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'popup.autoPanPadding' => [
			'type' => 'string',
			'required' => false,
			'default' => '50, 50',
		],
		'popup.closeButton' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'popup.closeOnEscapeKey' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'popup.className' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'popup.offset' => [
			'type' => 'string',
			'required' => false,
			'default' => '10, -10',
		],
		'popup.zoomAnimation' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],

		// @see https://leafletjs.com/reference.html#marker

		// 'marker.customIcon' => [
		// 	'type' => 'string',
		// 	'required' => false,
		// 	'default' => '',
		// ],
		'marker.draggable' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'marker.keyboard' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'marker.title' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'marker.alt' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'marker.zIndexOffset' => [
			'type' => 'int',
			'required' => false,
			'default' => 1000,
		],
		'marker.opacity' => [
			'type' => 'number',
			'required' => false,
			'default' => 0.8,
		],
		'marker.riseOnHover' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'marker.riseOffset' => [
			'type' => 'int',
			'required' => false,
			'default' => 500,
		],
		'marker.pane' => [
			'type' => 'string',
			'required' => false,
			'default' => 'markerPane',
		],
		'marker.autoPan' => [
			'type' => 'bool',
			'required' => false,
			'default' => 'markerPane',
		],
		'marker.autoPanPadding' => [
			'type' => 'string',
			'required' => false,
			'default' => '50, 50',
		],
		'marker.autoPanSpeed' => [
			'type' => 'int',
			'required' => false,
			'default' => 20,
		],

		// @see https://leafletjs.com/reference.html#fitbounds-options
		// 'map.fitBounds.maxZoom' => [
		// 	'type' => 'int',
		// 	'required' => false,

			// @Attention, default is null
		// 	'default' => '',
		// ],
		'map.fitBounds.animate' => [
			'type' => 'bool',
			'required' => false,

			// @Attention, default is null
			'default' => '',
		],
		'map.fitBounds.duration' => [
			'type' => 'number',
			'required' => false,
			'default' => 0.25,
		],
		'map.fitBounds.easeLinearity' => [
			'type' => 'number',
			'required' => false,
			'default' => 0.25,
		],
		'map.fitBounds.noMoveStart' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'map.fitBounds.paddingTopLeft' => [
			'type' => 'string',
			'required' => false,
			'default' => '0,0',
		],
		'map.fitBounds.paddingBottomRight' => [
			'type' => 'string',
			'required' => false,
			'default' => '0,0',
		],
		'map.fitBounds.padding' => [
			'type' => 'string',
			'required' => false,
			'default' => '0,0',
		],

		// custom parameters
		'lat-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'latitude',
		],
		'lon-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'longitude',
		],
		'title-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'name',
		],
		'height' => [
			'type' => 'string',
			'required' => false,
			'default' => '380px',
		],
		'width' => [
			'type' => 'string',
			'required' => false,
			'default' => '100%',
		],
		'markerCluster' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'markerTooltip' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
		'ignoreEmptyCoordinates' => [
			'type' => 'bool',
			'required' => false,
			'default' => true,
		],
	];

	public function isHtml() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		$results = $this->queryProcessor->getResults();
		if ( count( $this->queryProcessorErrors() ) ) {
			return implode( ', ', $this->queryProcessorErrors() );
		}
		if ( $this->params['debug'] ) {
			return $results;
		}
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @inheritDoc
	 */
	public function processResults( $results, $schema ) {
		$this->mapProperties = [
			$this->params['lat-property'] => 'latitude',
			$this->params['lon-property'] => 'longitude',
			$this->params['title-property'] => 'name',
		];

		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
			if ( $title_->isSpecial( 'Badtitle' ) ) {
				continue;
			}
			$ret[] = $this->processRow( $title_, $row, $categories );
		}

		return $this->processRoot( $ret );
	}

	/**
	 * @inheritDoc
	 */
	public function processRow( $title, $value, $categories ) {
		$this->json[] = [];

		if ( !empty( $this->params['pagetitle'] ) ) {
			// main label
			$formatted = Linker::link( $title, $title->getFullText() );
			$this->json[count( $this->json ) - 1 ][''] = $formatted;
		}

		return parent::processRow( $title, $value, $categories );
	}

	/**
	 * @inheritDoc
	 */
	public function processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast ) {
		$value = parent::processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast );

		if ( !empty( $this->printouts[$path] ) ) {
			// it's not clear if there is an use for that ...
			// if ( !isset( $this->json[count( $this->json ) - 1][$path] ) ) {
			// 	$this->json[count( $this->json ) - 1][$path][] = $value;
			// }
		}

		$isRoot = ( $path === '' );

		if ( !$isRoot ) {
			// *** important, return for later use
			return $value;
		}

		$thisClass = $this;
		$replaceAliases = static function ( $arr, $str ) use( $thisClass, $value ) {
			foreach ( $arr as $text ) {
				if ( !in_array( $text, $thisClass->getValidPrintouts() ) ) {
					$thisClass->json[count( $thisClass->json ) - 1 ][$text] = $value;
					break;
				}
			}
		};

		if ( $this->hasTemplate( $path ) ) {
			$replaceAliases( self::$popupAliases, $value );
		}
	}

	/**
	 * @inheritDoc
	 */
	public function processChild( $title, $schema, $key, $properties, $categories, $path, $isArray, $isFirst, $isLast ) {
		$value = parent::processChild( $title, $schema, $key, $properties, $categories, $path, $isArray, $isFirst, $isLast );

		if ( array_key_exists( $key, $this->mapProperties ) ) {
			$this->json[count( $this->json ) - 1][$this->mapProperties[$key]] = (string)$properties[$key];
		}

		// *** important, return for use by the parent
		return $value;
	}

	/**
	 * @return bool
	 */
	public function hasValidData() {
		// empty coordinates are located in the Atlantic Ocean
		// near the coast of West Africa, which is often not relevant
		if ( !empty( $this->params['ignoreEmptyCoordinates'] ) ) {
			$arr = [];
			foreach ( $this->json as $value ) {
				if ( !empty( $value['latitude'] ) || !empty( $value['longitude'] ) ) {
					$arr[] = $value;
				}
			}
			$this->json = $arr;
		}

		if ( !count( $this->json ) ) {
			return false;
		}

		foreach ( $this->json as $value ) {
			if ( !empty( $value['latitude'] ) && !empty( $value['longitude'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		$this->modules[] = 'ext.VisualData.Leaflet';
		$params = $this->formatOptions( $this->params );

		if ( !$this->hasValidData() ) {
			return 'No coordinates found';
		}

		return HtmlClass::rawElement(
			'div',
			[
				'style' => 'width:' . $this->params['width'] . ';height:' . $this->params['height'],
				'class' => 'visualdata-map',
				'data-params' => json_encode( $params ),
				'data-json' => json_encode( $this->json ),
				'width' => $this->params['width'],
				'height' => $this->params['height'],
			],
			''
		);
	}

	/**
	 * @see https://github.com/SemanticMediaWiki/SemanticResultFormats/blob/master/formats/datatables/DataTables.php
	 * @param array $params
	 * @return array
	 */
	private function formatOptions( $params ) {
		$arrayTypes = [
			'map.center' => 'number',
			'icon.iconSize' => 'number',
			'icon.iconAnchor' => 'number',
			'icon.popupAnchor' => 'number',
			'icon.shadowSize' => 'number',
			'icon.shadowAnchor' => 'number',
			'popup.autoPanPadding' => 'number',
			'popup.offset' => 'number',
			'marker.autoPanPadding' => 'number',
			'map.fitBounds.paddingTopLeft' => 'number',
			'map.fitBounds.paddingBottomRight' => 'number',
			'map.fitBounds.padding' => 'number',
			// ...
		];

		$ret = [];
		foreach ( $params as $key => $value ) {

			// transform csv to array
			if ( array_key_exists( $key, $arrayTypes ) ) {

				// https://markjs.io/#mark
				if ( $arrayTypes[$key] === '' ) {
					$value = str_split( $value );

				} else {
					$value = preg_split( '/\s*,\s*/', $value, -1, PREG_SPLIT_NO_EMPTY );

					if ( $arrayTypes[$key] === 'number' ) {
						$value = array_map( static function ( $value ) {
							return (int)$value;
						}, $value );
					}
				}
			}

			// convert strings like columns.searchPanes.show
			// to nested objects
			$arr = explode( '.', $key );

			$ret = array_merge_recursive( $this->plainToNestedObj( $arr, $value ),
				$ret );

		}

		$isAssoc = static function ( $value ) {
			if ( !is_array( $value ) || $value === [] ) {
				return false;
			}
			return array_keys( $value ) !== range( 0, count( $value ) - 1 );
		};

		// remove $ret["searchPanes"] = [] if $ret["searchPanes"][0] === false
		foreach ( $ret as $key => $value ) {
			if ( $isAssoc( $value ) && array_key_exists( 0, $value ) ) {
				if ( $value[0] === false ) {
					unset( $ret[$key] );
				} else {
					unset( $ret[$key][0] );
				}
			}
		}

		return $ret;
	}

	/**
	 * @see https://github.com/SemanticMediaWiki/SemanticResultFormats/blob/master/formats/datatables/DataTables.php
	 * @param array $arr
	 * @param string $value
	 * @return array
	 */
	private function plainToNestedObj( $arr, $value ) {
		$ret = [];

		// link to first level
		$t = &$ret;
		foreach ( $arr as $key => $k ) {
			if ( !array_key_exists( $k, $t ) ) {
				$t[$k] = [];
			}
			// link to deepest level
			$t = &$t[$k];
			if ( $key === count( $arr ) - 1 ) {
				$t = $value;
			}
		}
		return $ret;
	}

}
