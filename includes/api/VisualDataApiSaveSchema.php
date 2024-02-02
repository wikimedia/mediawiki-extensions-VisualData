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

use MediaWiki\Extension\VisualData\DatabaseManager as DatabaseManager;
use MediaWiki\Extension\VisualData\SchemaProcessor as SchemaProcessor;

class VisualDataApiSaveSchema extends ApiBase {

	/**
	 * @inheritDoc
	 */
	public function isWriteMode() {
		return true;
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
		$schema = json_decode( $params['schema'], true );
		$dialogAction = $params['dialog-action'];
		$previousLabel = $params['previous-label'];

		if ( $dialogAction !== 'delete' && ( empty( $schema['wiki']['name'] ) || !count( $schema['properties'] ) ) ) {
			$this->dieWithError( 'apierror-visualdata-permissions-error' );
		}

		$errors = [];
		$update_items = [];
		$databaseManager = new DatabaseManager();

		if ( $dialogAction === 'delete' ) {
			$update_items[$previousLabel] = null;

			// if ( empty( $params['confirm-job-execution'] ) ) {
			// 	$jobsCount = $this->createJobs( $update_items, true );
			//
			// 	if ( $jobsCount > $GLOBALS['wgVisualDataCreateJobsWarningLimit'] ) {
			// 		$result->addValue( [ $this->getModuleName() ], 'jobs-count-warning', $jobsCount );
			// 		return true;
			// 	}
			// }

			$title_ = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $previousLabel );
			$wikiPage_ = \VisualData::getWikiPage( $title_ );
			$reason = '';
			\VisualData::deletePage( $wikiPage_, $user, $reason );

			// @FIXME
			$jobsCount = $databaseManager->deleteSchema( $update_items, $previousLabel );

			$result->addValue( [ $this->getModuleName() ], 'result-action', 'delete' );
			$result->addValue( [ $this->getModuleName() ], 'jobs-count', $jobsCount );
			$result->addValue( [ $this->getModuleName() ], 'deleted-items', array_keys( $update_items ) );
			return true;
		}

		$label = $schema['wiki']['name'];
		$pageTitle = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $label );

		$label = $pageTitle->getText();

		$resultAction = ( !empty( $previousLabel ) ? 'update' : 'create' );

		// rename
		if ( $resultAction === 'update' && $previousLabel !== $label ) {
			$update_items[$previousLabel] = $label;
			$jobsCount = 0;
			// if ( empty( $params['confirm-job-execution'] ) ) {
			// 	$jobsCount = $this->createJobs( $update_items, true );

			// 	if ( $jobsCount > $GLOBALS['wgVisualDataCreateJobsWarningLimit'] ) {
			// 		$result->addValue( [ $this->getModuleName() ], 'jobs-count-warning', $jobsCount );
			// 		return true;
			// 	}
			// }

			$title_from = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $previousLabel );
			$title_to = $pageTitle;

			// @FIXME: or use SubmitForm -> movePageApi
			$move_result = \VisualData::movePage( $user, $title_from, $title_to );

			if ( !$move_result->isOK() ) {
				$errors = $move_result->getErrorsByType( 'error' );
				foreach ( $errors as $key => &$error ) {
					$error = $this->getMessage( array_merge( [ $error['message'] ], $error['params'] ) )->parse();
				}

				$result->addValue( [ $this->getModuleName() ], 'result-action', 'error' );
				$result->addValue( [ $this->getModuleName() ], 'error', $error );
				return true;
			}

			// @TODO
			$jobsCount = $databaseManager->renameSchema( $update_items, $previousLabel, $label );

			$result->addValue( [ $this->getModuleName() ], 'label', $label );
			$result->addValue( [ $this->getModuleName() ], 'jobs-count', $jobsCount );
			$result->addValue( [ $this->getModuleName() ], 'previous-label', $previousLabel );
			$resultAction = 'rename';
		}

		$context = new RequestContext();
		$context->setTitle( !empty( $params['target-page'] ) ? Title::newFromText( $params['target-page'] ) :
			SpecialPage::getTitleFor( 'EditData' ) );

		$output = $context->getOutput();

		$schemaProcessor = new SchemaProcessor();
		$schemaProcessor->setOutput( $output );

		$recordedObj = $schemaProcessor->convertToSchema( $schema );

		// @TODO
		// retrieve renamed properties
		// $jobsCount = $databaseManager->renameProperties( $schema );

		\VisualData::saveRevision( $user, $pageTitle, json_encode( $recordedObj ) );

		$result->addValue( [ $this->getModuleName() ], 'result-action', $resultAction );
		$result->addValue( [ $this->getModuleName() ], 'result', $ret );

		$processedSchema = $schemaProcessor->processSchema( $recordedObj, $label );

		$result->addValue( [ $this->getModuleName() ], 'schemas', json_encode( [ $label => $processedSchema ] ) );
	}

	/**
	 * @see includes/htmlform/HTMLForm.php
	 * @param string $value
	 * @return Message
	 */
	protected function getMessage( $value ) {
		return Message::newFromSpecifier( $value )->setContext( $this->getContext() );
	}

	/**
	 * @inheritDoc
	 */
	public function getAllowedParams() {
		return [
			'schema' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			],
			'target-page' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => false
			],
			'previous-label' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => false
			],
			'dialog-action' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => false
			],
			'confirm-job-execution' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => false
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
