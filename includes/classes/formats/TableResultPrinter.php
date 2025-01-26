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
 * @copyright Copyright ©2024-2025, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use Linker;
use MediaWiki\Extension\VisualData\DatabaseManager;
use MediaWiki\Extension\VisualData\ResultPrinter;
use MediaWiki\Extension\VisualData\Utils\HtmlTable;
use Parser;
use Title;

class TableResultPrinter extends ResultPrinter {

	/** @var HtmlTable */
	protected $htmlTable;

	/** @var array */
	protected $headers = [];

	/** @var array */
	protected $json = [];

	/** @var array */
	protected $headersRaw = [];

	/** @var array */
	protected $htmlInputs = [ 'TinyMCE', 'VisualEditor' ];

	/** @var array */
	protected $categoryFields = [];

	/** @var array */
	public static $parameters = [
		'mode' => [
			'type' => 'string',
			'required' => false,
			// auto, plain, nested
			'default' => 'auto',
		],
	];

	/**
	 * @inheritDoc
	 */
	public function isHtml() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function processRow( $title, $value, $categories ) {
		$this->json[] = [];
		if ( !empty( $this->params['pagetitle'] ) ) {
			// main label
			$formatted = Linker::link( $title, $title->getFullText() );
			$this->json[count( $this->json ) - 1 ][''][] = $formatted;
		}

		$path = '';
		$pathNoIndex = '';

		$method = ( $this->params['mode'] === 'plain' ? 'processSchemaRec' : 'processSchemaRecTree' );
		return $this->$method( $title, $this->schema, $value, $categories, $path, $pathNoIndex );
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

		// expand cell template as it was the root parent in template format
		foreach ( $this->printouts as $key_ => $value_ ) {
			if ( !empty( $value_ )
				&& !isset( $this->json[count( $this->json ) - 1][$key_] )
			) {
				if ( $this->hasTemplate( $key_ ) ) {
					$ret_ = parent::processParent( $title, $schema, $properties, $categories, $key_, $recPaths, $isFirst, $isLast );

					// *** the following won't be applied in processParent
					// since $key_ is not empty
					$ret_ = Parser::stripOuterParagraph(
							$this->parser->recursiveTagParseFully( $ret_ )
						);
					$this->json[count( $this->json ) - 1][$key_][] = $ret_;

				} else {
					// @TODO this could or should be moved to parent::processParent

					// this is triggered in mode-nested or plain, in mode plain
					// if the similar block below does not handle
					// $this->json[count( $this->json ) - 1][$key_]
					foreach ( self::$categoriesAliases as $alias ) {
						if ( $key_ === $alias && !in_array( $alias, $this->getValidPrintouts() ) ) {
							$this->json[count( $this->json ) - 1][$key_] = $this->formatCategories( $categories );
							if ( !in_array( $key_, $this->categoryFields ) ) {
								$this->categoryFields[] = $key_;
							}
						}
					}
				}
			}
		}

		return $value;
	}

	/**
	 * @param array $categories
	 * @return array
	 */
	private function formatCategories( $categories ) {
		$ret = [];
		foreach ( $categories as $value ) {
			if ( empty( $value ) ) {
				continue;
			}
			$title_ = Title::newFromText( $value, NS_CATEGORY );
			$ret[] = Linker::link( $title_, ( $title_ ? $title_->getText() : $value ) );
		}
		return $ret;
	}

	/**
	 * @inheritDoc
	 */
	public function processChild( $title, $schema, $key, $properties, $categories, $path, $isArray, $isFirst, $isLast ) {
		$value = parent::processChild( $title, $schema, $key, $properties, $categories, $path, $isArray, $isFirst, $isLast );

		// skip printouts like "a="
		if ( empty( $this->printouts[$path] ) ) {
			// *** important, return for use by the parent
			return $value;
		}

		// if ( $isArray ) {
		// 	$key = $path;
		// }

		$fieldName = $this->getFieldName( $schema, $path );
		$this->headers[$path] = $fieldName;
		$this->headersRaw[$path] = $this->isHeaderRaw( $schema, $path );

		$this->mapPathSchema[$path] = $schema;

		if ( $this->hasTemplate( $path ) ) {
			$value = Parser::stripOuterParagraph(
				$this->parser->recursiveTagParseFully( $value )
			);
		}

		// this is triggered in mode-plain
		if ( !in_array( $key, $this->getValidPrintouts() )
			&& in_array( $key, self::$categoriesAliases )
		) {
			$this->json[count( $this->json ) - 1][$path] = $this->formatCategories( explode( ', ', $value ) );
			if ( !in_array( $key, $this->categoryFields ) ) {
				$this->categoryFields[] = $key;
			}
		} else {
			$this->json[count( $this->json ) - 1][$path][] =
				( is_string( $value ) ? trim( $value ) : $value );
		}

		// *** important, return for use by the parent
		return $value;
	}

	/**
	 * @param string $schema
	 * @param string $path
	 * @return string
	 */
	protected function isHeaderRaw( $schema, $path ) {
		if ( $this->hasTemplate( $path ) ) {
			return true;
		}

		// @TODO add printout option |+ html
		// @see DatatableResultPrinter -> getPrintoutsOptions
		if ( !empty( $schema['wiki']['preferred-input'] )
			&& in_array( $schema['wiki']['preferred-input'], $this->htmlInputs )
		) {
			return true;
		}

		return false;
	}

	/**
	 * @param string $schema
	 * @param string $path
	 * @return string
	 */
	protected function getFieldName( $schema, $path ) {
		// @TODO $this->printouts[$path] should be null if not
		// set by the user
		// label from printout (|?a=b)
		if ( $this->printouts[$path] !== $path ) {
			return $this->printouts[$path];
		}

		// label from schema title
		if ( array_key_exists( 'title', $schema )
			&& !empty( $schema['title'] )
		) {
			return $schema['title'];
		}

		return $path;
	}

	/**
	 * @param string $path
	 * @param string $value
	 * @return array
	 */
	public function escapeCell( $path, $value ) {
		if ( $this->headersRaw[$path] ) {
			return $value;
		}
		// @see MediaWiki\Html\Html -> Element
		return strtr( $value ?? '', [ '&' => '&amp;', '<' => '&lt;', '>' => '&gt;' ] );
	}

	/**
	 * @return array
	 */
	public function formatJson() {
		// remove headers, they aren't necessary
		// except for nested data @see https://datatables.net/reference/option/columns.data
		// however the formatting of the static table
		// must be kept in synch with this
		$ret = [];

		// order $this->headers based on $this->printouts
		$printouts = [ '', ...array_keys( $this->printouts ) ];

		$sortFunction = static function ( $a, $b ) use ( $printouts ) {
			$iA = array_search( $a, $printouts );
			$iB = array_search( $b, $printouts );
			if ( $iA > $iB ) {
				return 1;
			}
			if ( $iA < $iB ) {
				return -1;
			}
			return 0;
		};

		uksort( $this->headers, $sortFunction );
		uksort( $this->headersRaw, $sortFunction );

		foreach ( $this->json as $i => $row ) {
			foreach ( $this->headers as $path => $header ) {
				$ret[$i][] = ( array_key_exists( $path, $row ) ? $row[$path] : [ '' ] );
			}
		}

		return $ret;
	}

	/**
	 * @param array $validPrintouts
	 */
	private function determineMode( $validPrintouts ) {
		if ( in_array( $this->params['mode'], [ 'nested', 'plain' ] ) ) {
			return;
		}

		$paths = [];
		$multipleValues = false;
		$callback = static function ( $schema, $path, $printout, $property ) use ( &$paths, $validPrintouts, &$multipleValues ) {
			if ( in_array( $printout, $validPrintouts ) ) {
				$pathArr = explode( '/', $path );
				array_pop( $pathArr );
				$paths[implode( '/', $pathArr )] = 1;
				if ( $schema['type'] === 'array' ) {
					$multipleValues = true;
				}
			}
		};
		$printout = '';
		$path = '';
		DatabaseManager::traverseSchema( $this->schema, $path, $printout, $callback );

		// use getResultsTree only if all printouts
		// are on the same level and one or more of
		// them is an array

		// @TODO nested mode could be used in all cases
		// of nested printouts provided that results
		// are consistent and that children can be
		// rendered using templates
		$this->params['mode'] = ( $multipleValues && count( $paths ) === 1
			? 'nested' : 'plain' );
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		$validPrintouts = $this->getValidPrintouts();
		$this->determineMode( $validPrintouts );

		$method = ( $this->params['mode'] === 'plain' ? 'getResults' : 'getResultsTree' );
		$results = $this->queryProcessor->$method();

		if ( !count( $this->printouts ) ) {
			$this->printouts = array_combine( $this->getValidPrintouts(), $this->getValidPrintouts() );
		}

		if ( count( $this->queryProcessorErrors() ) ) {
			return implode( ', ', $this->queryProcessorErrors() );
		}

		if ( $this->params['debug'] ) {
			return $results;
		}

		$this->htmlTable = new htmlTable();
		$this->initializeHeaders();

		return $this->processResults( $results, $this->schema );
	}

	protected function initializeHeaders() {
		if ( !empty( $this->params['pagetitle'] ) ) {
			$this->headers[''] = $this->params['pagetitle'];
			$this->headersRaw[''] = true;
		}

		foreach ( $this->printouts as $key => $value ) {
			if ( !empty( $value ) ) {
				$this->headers[$key] = $value;
				$this->headersRaw[$key] = true;
			}
		}
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
	 * @inheritDoc
	 */
	public function createHtmlTable() {
		$this->json = $this->formatJson();

		$attributes = [];
		foreach ( $this->headers as $path => $header ) {
			$this->htmlTable->header( $header, $attributes );
		}

		$headersRaw = array_values( $this->headersRaw );

		foreach ( $this->json as $row ) {
			$this->htmlTable->row();
			foreach ( $row as $key => $cell ) {
				$method = ( $headersRaw[$key] ? 'cellRaw' : 'cell' );
				$this->htmlTable->$method( implode( $this->valuesSeparator, $cell ) );
			}
		}
	}

	/**
	 * @return int
	 */
	public function getCount() {
		$method = ( $this->params['mode'] === 'plain' ? 'getCount' : 'getCountTree' );
		return $this->queryProcessor->$method();
	}

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		$this->createHtmlTable();

		$tableAttrs = [];
		$tableAttrs['width'] = '100%';
		$tableAttrs['class'] = 'wikitable display dataTable';

		return $this->htmlTable->table(
			$tableAttrs
		);
	}
}
