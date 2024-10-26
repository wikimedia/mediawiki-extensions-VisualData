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

use Linker;
use MediaWiki\Extension\VisualData\ResultPrinter;
use MediaWiki\Extension\VisualData\Utils\HtmlTable;
use Parser;

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
	public static $parameters = [
		// *** @FIXME temporary parameter, see below
		'mode' => [
			'type' => 'string',
			'required' => false,
			'default' => 'flat',
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
	public function processRow( $title, $value ) {
		$this->json[] = [];
		if ( !empty( $this->params['pagetitle'] ) ) {
			// main label
			$formatted = Linker::link( $title, $title->getFullText() );
			$this->json[count( $this->json ) - 1 ][''][] = $formatted;
		}

		$path = '';
		$pathNoIndex = '';

		// @FIXME TEMPORARY PARAMETER see below
		$method = ( empty( $this->params['mode'] ) || $this->params['mode'] !== 'tree' ? 'processSchemaRec' : 'processSchemaRecTree' );
		return $this->$method( $title, $this->schema, $value, $path, $pathNoIndex );
	}

	/**
	 * @inheritDoc
	 */
	public function processChild( $title, $schema, $key, $properties, $path, $isArray ) {
		// skip printouts as "a="
		if ( empty( $this->printouts[$path] ) ) {
			return '';
		}

		$value = parent::processChild( $title, $schema, $key, $properties, $path, $isArray );

		if ( $isArray ) {
			$key = $path;
		}

		// label from printout (|?a=b)
		if ( $this->printouts[$path] !== $path ) {
			$key = $this->printouts[$path];

		// label from schema title
		} elseif ( array_key_exists( 'title', $schema )
			&& !empty( $schema['title'] ) ) {
			$key = $schema['title'];
		}

		$this->headers[$path] = $key;
		$this->mapPathSchema[$path] = $schema;

		if ( !$this->hasTemplate( $path ) ) {
			// @TODO add printout option |+ html
			// @see DatatableResultPrinter -> getPrintoutsOptions
			if ( empty( $schema['wiki']['preferred-input'] )
				|| !in_array( $schema['wiki']['preferred-input'], $this->htmlInputs )
			) {
				$this->headersRaw[$path] = false;
			} else {
				$this->headersRaw[$path] = true;
			}
		} else {
			$value = Parser::stripOuterParagraph(
				$this->parser->recursiveTagParseFully( $value )
			);
			$this->headersRaw[$path] = true;
		}

		// keep temporarily headers to group values
		// in the same cell
		$this->json[count( $this->json ) - 1][$path][] = $value;

		return $value;
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
		$headers = array_keys( $this->headers );
		foreach ( $this->json as $i => $row ) {
			foreach ( $headers as $ii => $header ) {
				$values = ( array_key_exists( $header, $row ) ? $row[$header] : [ '' ] );
				foreach ( $values as $value ) {
					if ( !$this->headersRaw[$header] ) {
						// @see MediaWiki\Html\Html -> Element
						$value = strtr( $value ?? '', [ '&' => '&amp;', '<' => '&lt;' ] );
					}
					$ret[$i][$ii][] = $value;
				}
			}
		}
		return $ret;
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		// @FIXME TEMPORARY PARAMETER
		// this should be determined automatically
		// based on the number of rows returned by the query
		// (however this implies a first query queryProcessor->getResultsTree)
		$method = ( empty( $this->params['mode'] ) || $this->params['mode'] !== 'tree' ? 'getResults' : 'getResultsTree' );
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
		if ( !empty( $this->params['pagetitle'] ) ) {
			$this->headers[''] = $this->params['pagetitle'];
			$this->headersRaw[''] = true;
		}

		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @inheritDoc
	 */
	public function processResults( $results, $schema ) {
		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row ] = $value;

			// @TODO implement file value from mainlabel
			$ret[] = $this->processRow( $title_, $row );
		}

		if ( empty( $this->params['api'] ) ) {
			return $this->processRoot( $ret );
		}

		return $this->returnRawResult( $this->formatJson() );
	}

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		$attributes = [];
		foreach ( $this->headers as $header ) {
			$this->htmlTable->header( $header, $attributes );
		}

		foreach ( $this->json as $row ) {
			$this->htmlTable->row();
			foreach ( $row as $key => $cell ) {
				$method = ( $this->headersRaw[$key] ? 'cellRaw' : 'cell' );
				$this->htmlTable->$method( implode( $this->valuesSeparator, $cell ) );
			}
		}

		$tableAttrs = [];
		$tableAttrs['width'] = '100%';
		$tableAttrs['class'] = 'wikitable display dataTable';

		return $this->htmlTable->table(
			$tableAttrs
		);
	}
}
