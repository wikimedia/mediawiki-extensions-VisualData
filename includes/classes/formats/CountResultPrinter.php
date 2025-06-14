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
 * @copyright Copyright ©2024, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use MediaWiki\Extension\VisualData\DatabaseManager;
use MediaWiki\Extension\VisualData\ResultPrinter;

class CountResultPrinter extends ResultPrinter {

	/** @var array */
	public static $parameters = [
		'mode' => [
			'type' => 'string',
			'required' => false,
			// auto, plain, nested
			'default' => 'auto',
		],
	];

	public function isHtml() {
		return false;
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

		$this->params['mode'] = ( $multipleValues && count( $paths ) === 1
			? 'nested' : 'plain' );
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		$validPrintouts = $this->getValidPrintouts();
		$this->determineMode( $validPrintouts );

		$method = ( $this->params['mode'] === 'plain' ? 'getCount' : 'getCountTree' );
		return $this->queryProcessor->$method();
	}

}
