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

use MediaWiki\Extension\VisualData\ResultPrinter;

class JsonResultPrinter extends ResultPrinter {

	public function isHtml() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
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
	 * @param array $results
	 * @param array $schema
	 * @return string
	 */
	public function processResults( $results, $schema ) {
		// *** not working MW 1.41.0
		// $this->output->addModuleStyles( [ 'mediawiki.content.json' ] );

		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
			if ( $title_->isSpecial( 'Badtitle' ) ) {
				continue;
			}
			$ret_ = [
				'title' => $title_->getFullText(),
				'pageid' => $title_->getArticleID(),
				'data' => $row,
			];

			if ( !empty( $this->params['categories'] ) ) {
				$ret_['categories'] = $categories;
			}

			$ret[] = $ret_;
		}

		$content = new \JsonContent( '' );
		return $content->rootValueTable( json_decode( json_encode( $ret ), false ) );
	}
}
