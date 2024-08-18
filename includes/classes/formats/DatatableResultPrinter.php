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
 * @copyright Copyright ©2023, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

class DatatableResultPrinter extends TableResultPrinter {

	/** @var array */
	public static $parameters = [
		'datatables-searchPanes' => [
			'type' => 'bool',
			'required' => false,
			'default' => false,
		],
		'datatables-pageLength' => [
			'type' => 'int',
			'required' => false,
			'default' => 20,
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

		// @TODO add all here https://www.semantic-mediawiki.org/wiki/Help:Datatables_format
	];

	/**
	 * @inheritDoc
	 */
	public function processRoot( $row ) {
		$attributes = [];
		foreach ( $this->headers as $header ) {
			$this->htmlTable->header( $header, $attributes );
		}

		$tableAttrs = [];
		$tableAttrs['data-conf'] = json_encode( $this->getConf() );
		// $tableAttrs['data-count'] = $this->queryProcessor->getCount();
		$tableAttrs['data-query'] = json_encode( $this->queryProcessor->getQueryData() );
		$tableAttrs['width'] = '100%';
		$tableAttrs['class'] = 'visualdata datatable display dataTable';

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
