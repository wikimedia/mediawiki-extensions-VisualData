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

class JsonRawResultPrinter extends ResultPrinter {

	/** @var array */
	public static $parameters = [
		'nested' => [
			'type' => 'boolean',
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
		$method = ( $this->params['nested'] ? 'getResultsTree'
			: 'getResults' );
		$results = $this->queryProcessor->$method();
		if ( count( $this->queryProcessorErrors() ) ) {
			return [ 'errors' => $this->queryProcessorErrors() ];
		}
		if ( $this->params['debug'] ) {
			return [ 'sql' => $results ];
		}
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @param array $results
	 * @param array $schema
	 * @return array
	 */
	public function processResults( $results, $schema ) {
		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
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

		return $this->returnRawResult( $ret );
	}
}
