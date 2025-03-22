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
 * @copyright Copyright ©2023-2025, https://wikisphere.org
 */

use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
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
		$apiParams = $this->extractRequestParams();
		// $output = $this->getContext()->getOutput();

		$data = json_decode( $apiParams['data'], true );

		if ( !empty( $data['synch'] ) ) {
			return $this->synchData( $data, $result );
		}

		$datatableData = $data['datatableData'];
		$cacheKey = $data['cacheKey'];
		$settings = $data['settings'];
		$columnDefs = $data['columnDefs'];
		$printouts = $data['printouts'];
		$query = $data['query']['query'];
		$params = $data['params'];
		$categoryFields = $data['categoryFields'];

		$templates = $data['templates'];
		// $queryParams = $data['query']['params'];
		$sourcePage = $data['sourcePage'];

		if ( \VisualData::isList( $printouts ) ) {
			$printouts = array_combine( array_values( $printouts ), array_values( $printouts ) );
		}

		$subjectExpression = static function ( $printout ) use ( $categoryFields ) {
			// category
			if ( in_array( $printout, $categoryFields ) ) {
				return 'Category:';
			}

			// title
			if ( $printout === '' ) {
				return '';
			}

			return "$printout::";
		};

		// filter the query
		$queryConjunction = [];
		if ( !empty( $datatableData['search']['value'] ) ) {
			$queryDisjunction = [];
			foreach ( $columnDefs as $key => $value ) {
				$printout = $value['name'];
				$queryDisjunction[] = $subjectExpression( $printout ) . '~' . $datatableData['search']['value'] . '~';
			}
			$queryConjunction[] = '[[' . implode( '||', $queryDisjunction ) . ']]';
		}

		if ( !empty( $datatableData['searchPanes'] ) ) {
			// filter empty panes, that seem to appear only when
			// $datatableData['search']['value'] is not empty
			$datatableData['searchPanes'] = array_filter( $datatableData['searchPanes'] );

			foreach ( $datatableData['searchPanes'] as $key => $values ) {
				$printout = $datatableData['columns'][$key]['name'];
				// @TODO consider combiner
				// https://www.semantic-mediawiki.org/wiki/Help:Unions_of_results#User_manual
				$queryConjunction[] = '[[' . $subjectExpression( $printout ) . implode( '||', $values ) . ']]';
			}
		}

		$query .= implode( '', $queryConjunction );

		$order = [];
		foreach ( $datatableData['order'] as $value ) {
			if ( $value['name'] === '' ) {
				foreach ( ResultPrinter::$titleAliases as $alias ) {
					if ( !array_key_exists( $alias, $printouts ) ) {
						$value['name'] = $alias;
						break;
					}
				}
			}
			$order[] = $value['name'] . " " . $value['dir'];
		}

		// @TODO limit taking into account PreloaData
		$params['limit'] = max( $datatableData['length'], $params['limit'] );
		$params['offset'] = $datatableData['start'];
		$params['order'] = implode( ' ', $order );
		$params['api'] = $data['api'];
		$params['format'] = 'table';

		// *** url params are restored for the use
		// with the template ResultPrinter which
		// may use the "urlget" parser function or similar
		$_GET = $data['urlParams'];

		$parser = MediaWikiServices::getInstance()->getParserFactory()->create();
		// $templates = [];

		// @see ApiExpandTemplates
		$parserOptions = ParserOptions::newFromContext( $context );
		$titleObj = TitleClass::newFromText( $sourcePage );
		$parser->startExternalParse( $titleObj, $parserOptions, Parser::OT_PREPROCESS );

		$printoutsOptions = [];
		$errors_ = [];
		$resultPrinter = \VisualData::getResults(
			$parser,
			$context,
			$query,
			$templates,
			$printouts,
			$params,
			$printoutsOptions,
			$errors_
		);

		if ( !$resultPrinter ) {
			return null;
		}

		$ret = $resultPrinter->getResults();

		if ( empty( $params['api'] ) ) {
			$result->addValue( [ $this->getModuleName() ], 'result', $ret );
			return;
		}

		if ( !empty( $datatableData['search']['value'] ) || count( $queryConjunction ) ) {
			$count = $resultPrinter->getCount();
		} else {
			$count = $settings['count'];
		}

		$log = [
			'query' => $query,
			'params' => $params
		];
		// @see https://datatables.net/extensions/scroller/examples/initialisation/server-side_processing.html
		$ret = [
			'draw' => $datatableData['draw'],
			'data' => $ret,
			'recordsTotal' => $settings['count'],
			'recordsFiltered' => $count,
			'cacheKey' => $cacheKey,
			'datalength' => $datatableData['length'],
			'start' => $datatableData['start']
		];

		$result->addValue( [ $this->getModuleName() ], 'result', $ret );
		$result->addValue( [ $this->getModuleName() ], 'log', $log );
	}

	/**
	 * @param array $data
	 * @param MediaWiki/MediaWikiServices/ApiResult $result
	 * @return void
	 */
	private function synchData( $data, $result ) {
		$query = $data['query'];
		$params = $data['params'];
		$printouts = $data['printouts'];
		$sourcePage = $data['sourcePage'];
		$templates = $data['templates'];
		$context = RequestContext::getMain();

		// *** url params are restored for the use
		// with the template ResultPrinter which
		// may use the "urlget" parser function or similar
		$_GET = $data['urlParams'];

		$params['api'] = $data['api'];
		$params['format'] = ( $params['api'] ? 'table' : 'datatable' );

		$synchProperty = 'Creation date';
		$allowedSynchProperties = [
			'CreationDate',
			'Creation date',
			'ModificationDate',
			'Modification date'
		];

		if ( !empty( $data['synchProperty'] )
			&& in_array( $data['synchProperty'], $allowedSynchProperties )
		) {
			$synchProperty = $data['synchProperty'];
		}

		if ( !empty( $data['api'] ) ) {
			$query .= '[[' . $synchProperty . ' > ' . $data['queryTime'] . ']]';
		}

		$parser = MediaWikiServices::getInstance()->getParserFactory()->create();

		// @see ApiExpandTemplates
		$parserOptions = ParserOptions::newFromContext( $context );
		$titleObj = TitleClass::newFromText( $sourcePage );
		$parser->startExternalParse( $titleObj, $parserOptions, Parser::OT_PREPROCESS );

		$printoutsOptions = [];
		$errors_ = [];
		$resultPrinter = \VisualData::getResults(
			$parser,
			$context,
			$query,
			$templates,
			$printouts,
			$params,
			$printoutsOptions,
			$errors_
		);

		if ( !$resultPrinter ) {
			return;
		}

		$log = [
			'query' => $query,
			'params' => $params
		];

		if ( !empty( $data['api'] ) ) {
			$count = $resultPrinter->getCount();
			$ret = [
				'queryTime' => date( 'Y-m-d H:i:s' ),
				'count' => $count
			];

			// purge page, clear cache
			if ( $count ) {
				\VisualData::purgeArticle( $titleObj );
			}

		} else {
			$results = $resultPrinter->getResults();
			$ret = [
				'data' => $results
			];
		}

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
