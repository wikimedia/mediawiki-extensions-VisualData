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

use MediaWiki\Extension\VisualData\DatabaseManager;
use MediaWiki\Extension\VisualData\SchemaProcessor;

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
		$derivativeContext = new DerivativeContext( RequestContext::getMain() );

		// $output = $context->getOutput();
		$params = $this->extractRequestParams();

		$sourcePage = null;
		if ( !empty( $params['source-page'] ) ) {
			$sourcePage = Title::newFromText( $params['source-page'] );
		}

		if ( !$sourcePage || !\VisualData::isKnownArticle( $sourcePage ) ) {
			$sourcePage = Title::newMainPage();
		}

		$derivativeContext->setTitle( $sourcePage );

		$schema = json_decode( $params['schema'], true );
		$dialogAction = $params['dialog-action'];
		$previousLabel = $params['previous-label'];

		if ( $dialogAction !== 'delete' && ( empty( $schema['wiki']['name'] ) || !count( $schema['properties'] ) ) ) {
			$this->dieWithError( 'apierror-visualdata-permissions-error' );
		}

		$errors = [];
		$databaseManager = new DatabaseManager();
		$evaluateJobs = empty( $params['confirm-job-execution'] );

		if ( $dialogAction === 'delete' ) {
			if ( $evaluateJobs ) {
				$jobsCount = $databaseManager->deleteSchema( $user, $previousLabel, $evaluateJobs );
				if ( $jobsCount > $GLOBALS['wgVisualDataCreateJobsWarningLimit'] ) {
					$result->addValue( [ $this->getModuleName() ], 'jobs-count-warning', $jobsCount );
					return true;
				}
			}

			$title_ = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $previousLabel );
			$wikiPage_ = \VisualData::getWikiPage( $title_ );
			$reason = '';
			\VisualData::deletePage( $wikiPage_, $user, $reason );

			$jobsCount = $databaseManager->deleteSchema( $user, $previousLabel, false );

			$result->addValue( [ $this->getModuleName() ], 'result-action', 'delete' );
			$result->addValue( [ $this->getModuleName() ], 'jobs-count', $jobsCount );
			$result->addValue( [ $this->getModuleName() ], 'deleted-schema', $previousLabel );
			return true;
		}

		$label = $schema['wiki']['name'];
		$pageTitle = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $label );

		$label = $pageTitle->getText();

		$resultAction = ( !empty( $previousLabel ) ? 'update' : 'create' );

		if ( $resultAction === 'update' ) {
			$schemas = \VisualData::getSchemas( $derivativeContext, [ $label ] );
			$storedSchema = $schemas[$label];
		} else {
			$storedSchema = null;
		}

		// rename
		if ( $resultAction === 'update' && $previousLabel !== $label ) {

			if ( $evaluateJobs ) {
				$jobsCount = $databaseManager->renameSchema( $user, $previousLabel, $label, $evaluateJobs );
				if ( $jobsCount > $GLOBALS['wgVisualDataCreateJobsWarningLimit'] ) {
					$result->addValue( [ $this->getModuleName() ], 'jobs-count-warning', $jobsCount );
					return true;
				}
			}

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

			$jobsCount = $databaseManager->renameSchema( $user, $previousLabel, $label, false );
			$result->addValue( [ $this->getModuleName() ], 'label', $label );
			$result->addValue( [ $this->getModuleName() ], 'jobs-count', $jobsCount );
			$result->addValue( [ $this->getModuleName() ], 'previous-label', $previousLabel );
			$resultAction = 'rename';
		}

		$schemaProcessor = new SchemaProcessor( $derivativeContext );
		$recordedObj = $schemaProcessor->convertToSchema( $schema );
		$processedSchema = $schemaProcessor->processSchema( $recordedObj, $label );

		if ( $evaluateJobs ) {
			$jobsCount = $databaseManager->diffSchema( $user, $label, $storedSchema, $processedSchema, $evaluateJobs );
			if ( $jobsCount > $GLOBALS['wgVisualDataCreateJobsWarningLimit'] ) {
				$result->addValue( [ $this->getModuleName() ], 'jobs-count-warning', $jobsCount );
				return true;
			}
		}

		\VisualData::saveRevision( $user, $pageTitle, json_encode( $recordedObj ) );

		$jobsCount = $databaseManager->diffSchema( $user, $label, $storedSchema, $processedSchema, $evaluateJobs );

		$result->addValue( [ $this->getModuleName() ], 'jobs-count', $jobsCount );
		$result->addValue( [ $this->getModuleName() ], 'result-action', $resultAction );

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
			'source-page' => [
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
