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
		$this->htmlTable->row();

		if ( !empty( $this->params['pagetitle'] ) ) {
			// main label
			$this->headers[''] = $this->params['pagetitle'];
			$formatted = Linker::link( $title, $title->getFullText() );
			$this->htmlTable->cell( $formatted );
			$this->json[count( $this->htmlTable->rows )][] = $formatted;
		}

		$path = '';
		$pathNoIndex = '';
		return $this->processSchemaRec( $title, $this->schema, $value, $path, $pathNoIndex );
	}

	/**
	 * @inheritDoc
	 */
	public function processChild( $title, $schema, $key, $properties, $path ) {
		// skip printouts as "a="
		if ( empty( $this->printouts[$path] ) ) {
			return '';
		}

		$value = parent::processChild( $title, $schema, $key, $properties, $path );

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

		if ( $this->hasTemplate( $path ) ) {
			$value = Parser::stripOuterParagraph(
				$this->parser->recursiveTagParseFully( $value )
			);
		}
		$this->json[count( $this->htmlTable->rows )][] = $value;
		$this->htmlTable->cell( $value );

		return $value;
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
		$this->htmlTable = new htmlTable();
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		$attributes = [];
		foreach ( $this->headers as $header ) {
			$this->htmlTable->header( $header, $attributes );
		}
		$tableAttrs = [];
		$tableAttrs['width'] = '100%';
		$tableAttrs['class'] = ' wikitable display dataTable';

		return $this->htmlTable->table(
			$tableAttrs
		);
	}

}
