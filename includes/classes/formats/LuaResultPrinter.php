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

use MediaWiki\Extension\Scribunto\Engines\LuaStandalone\LuaStandaloneEngine;
use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\Extension\VisualData\ResultPrinter;

class LuaResultPrinter extends ResultPrinter {

	public function isHtml() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		if ( empty( $this->params['module'] ) ) {
			return wfMessage( 'visualdata-resultprinter-lua-module-error' )->text();
		}
		$title_ = TitleClass::newFromText( $this->params['module'], NS_TEMPLATE );
		if ( !$title_ || !$title_->isKnown ) {
			return wfMessage( 'visualdata-resultprinter-lua-module-error' )->text();
		}

		$results = $this->queryProcessor->getResultsTree();
		if ( count( $this->queryProcessorErrors() ) ) {
			return implode( ', ', $this->queryProcessorErrors() );
		}

		if ( $this->params['debug'] ) {
			return $results;
		}
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @param array $rows
	 * @return array
	 */
	public function processModule( $rows ) {
		$luaStandaloneEngine = new LuaStandaloneEngine( [
			'parser' => $this->parser,
			'title' => $this->parser->getTitle()
		] );
		$frameId = 'empty';
		$params = [ $rows ];

		// @TODO use LuaEngine->executeModule instead
		$text = $luaStandaloneEngine->expandTemplate( $frameId, $this->params['module'], $params );
		return $text[0];
	}

	/**
	 * @param array $results
	 * @param array $schema
	 * @return array
	 */
	public function processResults( $results, $schema ) {
		$rows = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
			$rows[] = [
				'title' => $title_->getFullText(),
				'pageid' => $title_->getArticleID(),
				'data' => $row,
				'categories' => $categories
			];
		}
		$rows = $this->returnRawResult( $rows );
		return $this->processModule( json_encode( $rows ) );
	}
}
