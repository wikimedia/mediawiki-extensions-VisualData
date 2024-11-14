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

use MediaWiki\Extension\VisualData\SchemaProcessor;

class VisualDataApiQueryOptions extends ApiBase {

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

		\VisualData::initialize();
		$result = $this->getResult();
		$params = $this->extractRequestParams();

		$data = json_decode( $params['data'], true );

		$wiki = [
			'options-query' => $data['query'],
			'query-schema' => $data['schema'],
			'query-printouts' => $data['properties'],
			'options-query-formula' => $data['options-query-formula'],
			'options-label-formula' => $data['options-label-formula']
		];

		// @TODO a single 'options-query' parameter could
		// be used, recording the kind of query in another parameter
		if ( empty( $data['schema'] ) ) {
			$wiki['options-smwquery'] = $data['query'];
			unset( $wiki['options-query'] );
		}

		$context = RequestContext::getMain();
		$schemaProcessor = new SchemaProcessor( $context );

		$errors = [];
		$optionsValues = $schemaProcessor->queryResults( $wiki, $errors );

		if ( count( $errors ) ) {
			$result->addValue( [ $this->getModuleName() ], 'error', $errors );
		} else {
			$result->addValue( [ $this->getModuleName() ], 'result', $optionsValues );
		}
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
	protected function getExamplesMessages() {
		return [
			'action=visualdata-queryoptions'
			=> 'apihelp-visualdata-queryoptions-example-1'
		];
	}
}
