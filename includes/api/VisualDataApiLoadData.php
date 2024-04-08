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
 * @copyright Copyright ©2021-2023, https://wikisphere.org
 */

// use MediaWiki\Extension\VisualData\SemanticMediawiki as SemanticMediawiki;

class VisualDataApiLoadData extends ApiBase {

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
		if ( !$user->isAllowed( 'visualdata-canmanageschemas' ) ) {
			$this->dieWithError( 'apierror-visualdata-permissions-error' );
		}
		\VisualData::initialize();
		$result = $this->getResult();
		$params = $this->extractRequestParams();
		$derivativeContext = new DerivativeContext( RequestContext::getMain() );

		$dataSet = explode( '|', $params['dataset'] );

		$ret = [];
		foreach ( $dataSet as $value ) {
			switch ( $value ) {
				case 'schemas':
					$schemasArr = \VisualData::getAllSchemas();
					$schemas = \VisualData::getSchemas( $derivativeContext, $schemasArr, false );
					$ret['schemas'] = $schemas;
					break;
			}
		}

		// @ATTENTION json_encode avoid internal mediawiki
		// transformations @see include/api/ApiResult.php -> getResultData
		foreach ( $ret as $key => $value ) {
			$result->addValue( [ $this->getModuleName() ], $key, json_encode( $value ) );
		}
	}

	/**
	 * @inheritDoc
	 */
	public function getAllowedParams() {
		return [
			'dataset' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			]
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
