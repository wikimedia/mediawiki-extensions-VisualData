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

use MediaWiki\Extension\VisualData\ResultPrinter;
use MediaWiki\MediaWikiServices;

class VisualDataApiDatatables extends ApiBase {

	/**
	 * @inheritDoc
	 */
	public function isWriteMode() {
		return false;
	}

	/**
	 * @inheritDoc
	 */
	public function mustBePosted(): bool {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function execute() {
		$user = $this->getUser();
		$context = RequestContext::getMain();

		\VisualData::initialize();
		$result = $this->getResult();
		$params = $this->extractRequestParams();
		// $output = $this->getContext()->getOutput();

		$data = json_decode( $params['data'], true );
		$datatableData = $data['datatableData'];
		$cacheKey = $data['cacheKey'];
		$settings = $data['settings'];
		$columnDefs = $data['columnDefs'];
		$printouts = $data['printouts'];
		$query = $data['query']['query'];
		// $params_ = $data['params'];
		$templates = $data['templates'];
		$params_ = $data['query']['params'];
		$sourcePage = $data['sourcePage'];

		if ( \VisualData::isList( $printouts ) ) {
			$printouts = array_combine( array_values( $printouts ), array_values( $printouts ) );
		}

		// filter the query
		$queryConjunction = [];

		if ( !empty( $datatableData['search']['value'] ) ) {
			$queryDisjunction = [];
			foreach ( $columnDefs as $key => $value ) {
				$printout = $value['name'];
				$queryDisjunction[] = ( $printout !== '' ? $printout . '::' : '' ) . '~' . $datatableData['search']['value'] . '~';
			}
			$queryConjunction[] = '[[' . implode( '||', $queryDisjunction ) . ']]';
		}

		foreach ( $datatableData['searchPanes'] as $key => $values ) {
			$printout = $datatableData['columns'][$key]['name'];
			// @TODO consider combiner
			// https://www.semantic-mediawiki.org/wiki/Help:Unions_of_results#User_manual
			$queryConjunction[] = '[[' . ( $printout !== '' ? $printout . '::' : '' ) . implode( '||', $values ) . ']]';
		}

		$query .= implode( '', $queryConjunction );

		$order = [];
		foreach ( $datatableData['order'] as $value ) {
			if ( $value['name'] === '' ) {
				foreach ( ResultPrinter::$titleAliases as $alias ) {
					if ( !array_key_exists( $printouts, $alias ) ) {
						$value['name'] = $alias;
						break;
					}
				}
			}
			$order[] = $value['name'] . " " . $value['dir'];
		}

		// $params_['format'] = 'json-raw';
		$params_['limit'] = max( $datatableData['length'], $params_['limit'] );
		$params_['offset'] = $datatableData['start'];
		$params_['order'] = implode( ' ', $order );

		// $results = \VisualData::getQueryResults( $params_['schema'], $query, $printouts, $params_ );
		$schema = $params_['schema'];

		// limit, offset, order
		$params_ = array_merge( $params_, [
			'schema' => $schema,
			'format' => 'table-raw'
		] );

		$parser = MediaWikiServices::getInstance()->getParserFactory()->create();
		// $templates = [];

		// @see ApiExpandTemplates
		$parserOptions = ParserOptions::newFromContext( $context );
		$titleObj = Title::newFromText( $sourcePage );
		$parser->startExternalParse( $titleObj, $parserOptions, Parser::OT_PREPROCESS );

		$resultPrinter = \VisualData::getResults(
			$parser,
			$context,
			$query,
			$templates,
			$printouts,
			$params_
		);

		if ( !$resultPrinter ) {
			return null;
		}

		$rows = $resultPrinter->getResults();

		if ( !empty( $datatableData['search']['value'] ) || count( $queryConjunction ) ) {
			$count = $resultPrinter->getCount();
		} else {
			$count = $settings['count'];
		}

		$log = [
			'query' => $query,
			'params' => $params_
		];
		// @see https://datatables.net/extensions/scroller/examples/initialisation/server-side_processing.html
		$ret = [
			'draw' => $datatableData['draw'],
			'data' => $rows,
			'recordsTotal' => $settings['count'],
			'recordsFiltered' => $count,
			'cacheKey' => $cacheKey,
			'datalength' => $datatableData['length'],
		];

		$result->addValue( [ $this->getModuleName() ], 'result', $ret );
		$result->addValue( [ $this->getModuleName() ], 'log', $log );
	}

	/**
	 * @inheritDoc
	 */
	public function getAllowedParams() {
		return [
			'data' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			],
		];
	}

	/**
	 * @inheritDoc
	 */
	public function needsToken() {
		return 'csrf';
	}

	/**
	 * @inheritDoc
	 */
	protected function getExamples() {
		return false;
	}
}
