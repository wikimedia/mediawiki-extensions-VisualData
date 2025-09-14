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
 * @copyright Copyright ©2023-2025, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
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
			'type' => 'array-integer',
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
			'type' => 'array-string',
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
			'type' => 'array-chunks',
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
			'type' => 'array-integer',
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
		// ***custom parameter
		'datatables-synch' => [
			'type' => 'boolean',
			'required' => false,
			'default' => false,
		],
		// seconds
		'datatables-synch.interval' => [
			'type' => 'integer',
			'required' => false,
			'default' => 100,
		],
		'datatables-synch.property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'Creation date',
		],
	];

	/**
	 * @var array
	 * @see https://datatables.net/reference/option/columns
	 */
	public static $printoutOptionsTypes = [
		'columns.cellType' => 'string',
		'columns.className' => 'string',
		'columns.contentPadding' => 'string',
		'columns.defaultContent' => 'string',
		'columns.name' => 'string',
		'columns.orderable' => 'boolean',
		'columns.orderData' => 'array-number',
		'columns.orderDataType' => 'string',
		'columns.searchable' => 'boolean',
		'columns.title' => 'string',
		'columns.type' => 'string',
		'columns.visible' => 'boolean',
		'columns.width' => 'string',
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

		$this->formattedPrintoutsOptions = $this->formatPrintoutsOptions( self::$printoutOptionsTypes, 'datatables-' );
		$this->count = $this->getCount();

		$this->query = $this->queryProcessor->getQueryData();
		$this->conf = $this->getFormattedParams( 'datatables-' );

		$tableAttrs['data-printouts-options'] = json_encode( $this->formattedPrintoutsOptions );
		$tableAttrs['data-map-path-schema'] = json_encode( $this->mapPathSchema );
		$tableAttrs['data-printouts'] = json_encode( $this->printouts );
		$tableAttrs['data-templates'] = json_encode( $this->templates );
		$tableAttrs['data-headers'] = json_encode( $this->headers );
		$tableAttrs['data-headers-raw'] = json_encode( $this->headersRaw );
		$tableAttrs['data-conf'] = json_encode( $this->conf );
		$tableAttrs['data-count'] = $this->count;
		$tableAttrs['data-params'] = json_encode( $this->params );
		$tableAttrs['data-category-fields'] = json_encode( $this->categoryFields );

		$tableAttrs['data-search-panes-options'] = json_encode( $this->getSearchPanesOptions() );

		// *** attention !!! "data-data" will conflict with
		// datatables internal conf
		$tableAttrs['data-json'] = json_encode( $this->json );

		// used by synch
		$tableAttrs['data-query-time'] = date( 'Y-m-d H:i:s', time() );

		$tableAttrs['data-query'] = json_encode( $this->query );
		$tableAttrs['width'] = '100%';
		$tableAttrs['class'] = 'visualdata datatable dataTable';
		$tableAttrs['class'] .= ( empty( $this->params['datatables-cards'] ) ?
			' display' : ' cards' );
		$tableAttrs['class'] .= ( !empty( $this->params['class'] ) ?
			' ' . $this->params['class'] : '' );

		return $this->htmlTable->table(
			$tableAttrs
		);
	}

	/**
	 * @inheritDoc
	 */
	public function processResults( $results, $schema ) {
		$ret = [];

		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;

			// @TODO implement file value from mainlabel
			$ret[] = $this->processRow( $title_, $row, $categories );
		}

		if ( empty( $this->params['api'] ) ) {
			return $this->processRoot( $ret );
		}

		$this->json = $this->formatJson();
		return $this->returnRawResult( $this->json );
	}

	/**
	 * @param array $params
	 * @param string $printout
	 * @return array|string
	 */
	private function newQuery( $params, $printout ) {
		$queryProcessor = new QueryProcessor( $this->user, $this->schema, $this->query['query'], [ $printout ], $params );

		if ( count( $queryProcessor->getValidPrintouts() ) !== 1 ) {
			return [];
		}

		$results = $queryProcessor->getResults();

		if ( $params['debug'] ) {
			return $results;
		}

		if ( count( $queryProcessor->getErrors() ) ) {
			return [];
		}

		$binLength = count( $results );
		$uniqueRatio = $binLength / $this->count;

		$threshold = ( !empty( $this->formattedPrintoutsOptions[$printout]['searchPanes']['threshold'] ) ?
			$this->formattedPrintoutsOptions[$printout]['searchPanes']['threshold'] : $this->conf['searchPanes']['threshold'] );

		if ( $uniqueRatio > $threshold ) {
			return [];
		}

		return $results;
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

			$results_ = $this->newQuery( $params, $printout );

			if ( $params['debug'] ) {
				$ret[$printout] = $results;
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

		if ( !$this->params['categories'] ) {
			return $ret;
		}

		$params = $this->query['params'];
		$params['count-categories'] = true;
		$params['count-printout-min'] = $this->conf['searchPanes']['minCount'];

		$queryProcessor = new QueryProcessor( $this->user, $this->schema, $this->query['query'], [], $params );
		$results = $queryProcessor->getResults();

		if ( count( $queryProcessor->getErrors() ) ) {
			return $ret;
		}

		if ( $params['debug'] ) {
			foreach ( $this->categoryFields as $printout ) {
				$ret[$printout] = $results;
			}
			return $ret;
		}

		$binLength = count( $results );
		$uniqueRatio = $binLength / $this->count;

		foreach ( $this->categoryFields as $printout ) {
			$threshold_ = ( !empty( $this->formattedPrintoutsOptions[$printout]['searchPanes']['threshold'] ) ?
				$this->formattedPrintoutsOptions[$printout]['searchPanes']['threshold'] : $this->conf['searchPanes']['threshold'] );

			if ( $uniqueRatio > $threshold_ ) {
				continue;
			}

			foreach ( $results as $k => $v ) {
				if ( empty( $k ) && empty( $this->conf['searchPanes']['showEmpty'] ) ) {
					continue;
				}

				$label_ = $k;
				if ( !empty( $k ) ) {
					$title_ = TitleClass::newFromText( $k, NS_CATEGORY );

					// this should be always true
					$label_ = ( $title_ ? $title_->getText() : $k );
				}

				$ret[$printout][] = [
					'label' => ( $k !== '' ? $this->escapeCell( $printout, $label_ )
						: "<i>{$this->conf['searchPanes']['emptyMessage']}</i>" ),
					'value' => $k,
					'count' => $v
				];
			}
		}

		return $ret;
	}
}
