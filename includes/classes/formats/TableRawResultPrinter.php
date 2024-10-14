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
use Parser;

class TableRawResultPrinter extends ResultPrinter {

	/** @var array */
	protected $json = [];

	/**
	 * @inheritDoc
	 */
	public function isHtml() {
		return false;
	}

	/**
	 * @inheritDoc
	 */
	public function processRow( $title, $value ) {
		if ( !empty( $this->params['pagetitle'] ) ) {
			$formatted = Linker::link( $title, $title->getFullText() );
			$this->json[][] = $formatted;
		} else {
			$this->json[] = [];
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

		if ( $this->hasTemplate( $path ) ) {
			$value = Parser::stripOuterParagraph(
				$this->parser->recursiveTagParseFully( $value )
			);
		}
		$this->json[count( $this->json ) - 1][] = $value;

		return $value;
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		$results = $this->queryProcessor->getResults();
		if ( count( $this->queryProcessorErrors() ) ) {
			return [ 'errors' => $this->queryProcessorErrors() ];
		}
		if ( $this->params['debug'] ) {
			return [ 'sql' => $results ];
		}
		$this->processResults( $results, $this->schema );
		return $this->returnRawResult( $this->json );
	}

}
