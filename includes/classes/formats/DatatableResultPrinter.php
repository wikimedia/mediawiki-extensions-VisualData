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
 * @copyright Copyright ©2023-2024, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use MediaWiki\Extension\VisualData\QueryProcessor;

class DatatableResultPrinter extends TableResultPrinter {

	/** @var int */
	private $count;

	/** @var array */
	private $query;

	/** @var array */
	private $conf;

	/** @var array */
	private $formattedPrintoutsOptions;

	/** @var array */
	public static $parameters = [
		'mode' => [
			'type' => 'string',
			'required' => false,
			// auto, tree, plain
			'default' => 'auto',
		],

		// ***custom parameter
		'displayLog' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],

		// https://datatables.net/reference/option/layout
		'datatables-layout.topStart' => [
			'type' => 'string',
			'required' => false,
			'default' => 'pageLength',
		],
		'datatables-layout.topEnd' => [
			'type' => 'string',
			'required' => false,
			'default' => 'search',
		],
		'datatables-layout.bottomStart' => [
			'type' => 'string',
			'required' => false,
			'default' => 'info',
		],
		'datatables-layout.bottomEnd' => [
			'type' => 'string',
			'required' => false,
			'default' => 'paging',
		],

		// @see https://www.semantic-mediawiki.org/wiki/Help:Datatables_format
		'datatables-autoWidth' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-deferRender' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-info' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'datatables-lengthChange' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'datatables-ordering' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'datatables-paging' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'datatables-processing' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-scrollX' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-scrollY' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'datatables-searching' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		// 'datatables-serverSide' => [
		// 	'type' => 'boolean',
		// 	'required' => false,
		// 	'default' => false,
		// ],
		'datatables-stateSave' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-displayStart' => [
			'type' => 'integer',
			'required' => false,
			'default' => 0,
		],
		'datatables-pagingType' => [
			'type' => 'string',
			'required' => false,
			'default' => 'full_numbers',
		],
		'datatables-pageLength' => [
			'type' => 'int',
			'required' => false,
			'default' => 20,
		],
		'datatables-lengthMenu' => [
			'type' => 'string',
			'required' => false,
			'default' => '10, 20, 50, 100, 200',
		],
		'datatables-scrollCollapse' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-scroller' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-scroller.displayBuffer' => [
			'type' => 'integer',
			'required' => false,
			'default' => 50,
		],
		'datatables-scroller.loadingIndicator' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false
		],
		'datatables-buttons' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		// deprecated
		// 'datatables-dom' => [
		// 	'type' => 'string',
		// 	'required' => false,
		// 	'default' => 'lfrtip',
		// ],
		'datatables-fixedHeader' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-responsive' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'datatables-keys' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],

		//////////////// datatables columns

		'datatables-columns.type' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'datatables-columns.width' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],

		//////////////// datatables mark
		// @see https://markjs.io/#mark
		// @see https://github.com/SemanticMediaWiki/SemanticResultFormats/pull/776
		// @TODO not yet implemented
		'datatables-mark' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false
		],
		'datatables-mark.separateWordSearch' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false
		],
		'datatables-mark.accuracy' => [
			'type' => 'string',
			'required' => false,
			'default' => 'partially',
		],
		'datatables-mark.diacritics' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'datatables-mark.acrossElements' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-mark.caseSensitive' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-mark.ignoreJoiners' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-mark.ignorePunctuation' => [
			'type' => 'string',
			'required' => false,
			// or ':;.,-–—‒_(){}[]!\'"+='
			'default' => '',
		],
		'datatables-mark.wildcards' => [
			'type' => 'string',
			'required' => false,
			'default' => 'disabled',
		],

		//////////////// datatables searchBuilder

		'datatables-searchBuilder' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],

		//////////////// datatables searchPanes

		'datatables-searchPanes' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],

		'datatables-searchPanes.emptyMessage' => [
			'type' => 'string',
			'required' => false,
			'default' => ''
		],

		'datatables-searchPanes.initCollapsed' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		'datatables-searchPanes.collapse' => [
			'type' => 'boolean',
			'required' => false,
			'default' => true,
		],
		'datatables-searchPanes.columns' => [
			'type' => 'string',
			'required' => false,
			'default' => '',
		],
		'datatables-searchPanes.threshold' => [
			'type' => 'float',
			'required' => false,
			'default' => 0.6,
		],
		// ***custom parameter
		'datatables-searchPanes.minCount' => [
			'type' => 'integer',
			'required' => false,
			'default' => 1
		],
		// ***custom parameter
		'datatables-searchPanes.showEmpty' => [
			'type' => 'bool',
			'required' => false,
			'default' => false
		],
		// ***custom parameter
		'datatables-searchPanes.htmlLabels' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],

		// ***custom parameter
		// @TODO sort panes after rendering using the following
		// https://github.com/DataTables/SearchPanes/blob/master/src/SearchPane.ts

		// $params['datatables-searchPanes.defaultOrder'] = [
		// 	'type' => 'string',
		// 	'message' => 'srf-paramdesc-datatables-library-option',
		// 	// label-sort, label-rsort, count-asc, count-desc
		// 	'default' => 'label-sort',
		// ];

		// 'datatables-columns.searchPanes.show' => [
		// 	'type' => 'boolean',
		// 	'required' => false,
		// 	'default' => false,
		// ],

		// ***custom parameter
		'datatables-cards' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
	];

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		// avoid error "Constant expression contains invalid operations"
		if ( empty( $this->params['datatables-searchPanes.emptyMessage'] ) ) {
			$this->params['datatables-searchPanes.emptyMessage'] = wfMessage( 'visualdata-datatatables-searchpanes-empty-message' )->text();
		}

		$this->modules[] = 'ext.VisualData.Datatables';

		$this->createHtmlTable();

		$tableAttrs = [];
		$formattedPrintoutsOptions = [];

		// pagetitle is ''
		foreach ( $this->printoutsOptions as $printout => $options ) {
			$formattedPrintoutsOptions[$printout] = $this->getPrintoutsOptions( $options );
		}

		$this->formattedPrintoutsOptions = $formattedPrintoutsOptions;
		$this->count = $this->getCount();

		$this->query = $this->queryProcessor->getQueryData();
		$this->conf = $this->getConf();

		$tableAttrs['data-printouts-options'] = json_encode( $formattedPrintoutsOptions );
		$tableAttrs['data-map-path-schema'] = json_encode( $this->mapPathSchema );
		$tableAttrs['data-printouts'] = json_encode( $this->printouts );
		$tableAttrs['data-templates'] = json_encode( $this->templates );
		$tableAttrs['data-headers'] = json_encode( $this->headers );
		$tableAttrs['data-headers-raw'] = json_encode( $this->headersRaw );
		$tableAttrs['data-conf'] = json_encode( $this->conf );
		$tableAttrs['data-count'] = $this->count;
		$tableAttrs['data-params'] = json_encode( $this->params );
		$tableAttrs['data-search-panes-options'] = json_encode( $this->getSearchPanesOptions() );

		// *** attention !!! "data-data" will conflict with
		// datatables internal conf
		$tableAttrs['data-json'] = json_encode( $this->json );

		$tableAttrs['data-query'] = json_encode( $this->query );
		$tableAttrs['width'] = '100%';
		$tableAttrs['class'] = 'visualdata datatable dataTable';
		$tableAttrs['class'] .= ( empty( $this->params['datatables-cards'] ) ?
			' display' : ' cards' );

		return $this->htmlTable->table(
			$tableAttrs
		);
	}

	/**
	 * @return array
	 */
	public function getConf() {
		$ret = [];
		foreach ( $this->params as $key => $value ) {
			if ( strpos( $key, 'datatables-' ) === 0 ) {
				$ret[str_replace( 'datatables-', '', $key )] = $value;
			}
		}
		return $this->formatOptions( $ret );
	}

	/**
	 * @see https://github.com/SemanticMediaWiki/SemanticResultFormats/blob/master/formats/datatables/DataTables.php
	 * @param array $params
	 * @return array
	 */
	private function formatOptions( $params ) {
		$arrayTypes = [
			'lengthMenu' => 'number',
			'buttons' => 'string',
			'searchPanes.columns' => 'number',
			'mark.ignorePunctuation' => '',
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
	 * @param array $parameters
	 * @return array
	 */
	private function getPrintoutsOptions( $parameters ) {
		$arrayTypesColumns = [
			'orderable' => 'boolean',
			'searchable' => 'boolean',
			'visible' => 'boolean',
			'orderData' => 'numeric-array',
			'searchPanes.collapse' => 'boolean',
			'searchPanes.controls' => 'boolean',
			'searchPanes.hideCount' => 'boolean',
			'searchPanes.orderable' => 'boolean',
			'searchPanes.initCollapsed' => 'boolean',
			'searchPanes.show' => 'boolean',
			'searchPanes.threshold' => 'number',
			'searchPanes.viewCount' => 'boolean',
			// ...
		];

		$ret = [];
		foreach ( $parameters as $key => $value ) {
			$key = preg_replace( '/datatables-(columns\.)?/', '', $key );
			$value = trim( $value );

			if ( array_key_exists( $key, $arrayTypesColumns ) ) {
				switch ( $arrayTypesColumns[$key] ) {
					case 'boolean':
						$value = strtolower( $value ) === 'true'
							|| ( is_numeric( $value ) && $value == 1 );
						break;

					case 'numeric-array':
						$value = preg_split( '/\s*,\s*/', $value, -1, PREG_SPLIT_NO_EMPTY );
						break;

					case 'number':
						$value = $value * 1;
						break;

					// ...
				}
			}

			// convert strings like columns.searchPanes.show
			// to nested objects
			$arr = explode( '.', $key );

			$ret = array_merge_recursive( $this->plainToNestedObj( $arr, $value ),
				$ret );
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

	/**
	 * @return array
	 */
	private function getSearchPanesOptions() {
		if ( $this->count <= count( $this->json ) ) {
			return [];
		}
		if ( empty( $this->conf['searchPanes'] ) ) {
			return [];
		}

		$ret = [];
		$params = $this->query['params'];
		$params['count-printout'] = true;
		$params['count-printout-min'] = $this->conf['searchPanes']['minCount'];

		foreach ( $this->printouts as $printout => $label ) {
			if ( empty( $label ) ) {
				continue;
			}
			$queryProcessor = new QueryProcessor( $this->schema, $this->query['query'], [ $printout ], $params );
			if ( count( $queryProcessor->getValidPrintouts() ) !== 1 ) {
				continue;
			}
			$results_ = $queryProcessor->getResults();
			if ( count( $queryProcessor->getErrors() ) ) {
				continue;
			}
			if ( $params['debug'] ) {
				$ret[$printout][] = $results_;
				continue;
			}
			$binLength = count( $results_ );
			$uniqueRatio = $binLength / $this->count;

			$threshold = ( !empty( $this->formattedPrintoutsOptions[$printout]['searchPanes']['threshold'] ) ?
				$this->formattedPrintoutsOptions[$printout]['searchPanes']['threshold'] : $this->conf['searchPanes']['threshold'] );

			if ( $uniqueRatio > $threshold ) {
				continue;
			}

			foreach ( $results_ as $k => $v ) {
				if ( empty( $k ) && empty( $this->conf['searchPanes']['showEmpty'] ) ) {
					continue;
				}
				$ret[$printout][] = [
					'label' => ( $k !== '' ? $this->escapeCell( $printout, $k )
						: "<i>{$this->conf['searchPanes']['emptyMessage']}</i>" ),
					'value' => $k,
					'count' => $v
				];
			}
		}
		return $ret;
	}
}
