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
 * @copyright Copyright ©2025, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\ResultPrinters;

use Linker;
use MediaWiki\Extension\VisualData\Aliases\Html as HtmlClass;
use MediaWiki\Extension\VisualData\ResultPrinter;

class CalendarResultPrinter extends ResultPrinter {

	/** @var array */
	private $json = [];

	/** @var array */
	private $mapProperties;

	/** @var array */
	public static $parameters = [
		// custom parameters
		'start-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'start',
		],
		'end-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'end',
		],
		'title-property' => [
			'type' => 'string',
			'required' => false,
			'default' => 'title',
		],
		'height' => [
			'type' => 'string',
			'required' => false,
			'default' => 'auto',
		],
		'width' => [
			'type' => 'string',
			'required' => false,
			'default' => '100%',
		],
	];

	public function isHtml() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getResults() {
		$results = $this->queryProcessor->getResultsTree();
		$errors = $this->queryProcessorErrors();
		if ( count( $errors ) === 1 && $errors[0] === 'schema has no data' ) {
			$errors = [];
		}
		if ( count( $errors ) ) {
			return implode( ', ', $errors );
		}
		if ( $this->params['debug'] ) {
			return $results;
		}
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @inheritDoc
	 */
	public function processResults( $results, $schema ) {
		$this->mapProperties = [
			$this->params['start-property'] => 'start',
			$this->params['end-property'] => 'end',
			$this->params['title-property'] => 'title',
		];

		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
			if ( $title_->isSpecial( 'Badtitle' ) ) {
				continue;
			}
			$ret[] = $this->processRowTree( $title_, $row, $categories );
		}

		return $this->processRoot( $ret );
	}

	/**
	 * @inheritDoc
	 */
	public function processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast ) {
		// $value = parent::processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast );

		$required = [ 'start', 'end' ];
		$mapValues = [];
		foreach ( $properties as $key => $value ) {
			if ( isset( $this->mapProperties[$key] ) ) {
				$mapValues[] = $this->mapProperties[$key];
			}
		}

		// $pathParent = substr( $path, 0, strrpos( $path, '/' ) );
		if ( count( array_intersect( $required, $mapValues ) ) === count( $required ) ) {
			$formatted = Linker::link( $title, $title->getFullText() );
			$this->json[] = [
				$formatted,
				$properties
			];
		}

		$isArray = ( $schema['type'] === 'array' );
		if ( $isArray ) {
			return $properties;
		}

		return $value;
	}

	/**
	 * @inheritDoc
	 */
	public function processRoot( $rows ) {
		$this->modules[] = 'ext.VisualData.Calendar';

		return HtmlClass::rawElement(
			'div',
			[
				'style' => 'width:' . $this->params['width'] . ';height:' . $this->params['height'],
				'class' => 'visualdata-calendar',
				'data-json' => json_encode( $this->json ),
				'width' => $this->params['width'],
				'height' => $this->params['height'],
			],
			''
		);
	}

}
