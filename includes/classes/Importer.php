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

namespace MediaWiki\Extension\VisualData;

use MediaWiki\Revision\SlotRecord;
use Title;

class Importer {

	/** @var User */
	private $user;

	/** @var string */
	private $schemaName;

	/** @var Context */
	private $context;

	/** @var Output */
	private $output;

	/** @var bool|int */
	private $limit = false;

	/** @var Importer|Importer1_35 */
	private $importer;

	/** @var bool */
	private $mainSlot = false;

	/** @var callback */
	private $showMsg;

	/**
	 * @param User $user
	 * @param Context $context
	 * @param string $schemaName
	 * @param bool|null $mainSlot false
	 * @param bool|null $limit false
	 */
	public function __construct( $user, $context, $schemaName, $mainSlot = false, $limit = false ) {
		$this->user = $user;
		$this->context = $context;
		$this->output = $this->context->getOutput();
		$this->schemaName = $schemaName;
		$this->mainSlot = $mainSlot;
		$this->limit = $limit;
	}

	/**
	 * @param string $pagenameFormula
	 * @param array $data
	 * @param function $showMsg
	 * @return bool|void
	 */
	public function importData( $pagenameFormula, $data, $showMsg ) {
		if ( empty( $pagenameFormula ) ) {
			$showMsg( 'no pagename formula' );
			return false;
		}

		$this->showMsg = $showMsg;
		$schema = \VisualData::getSchema( $this->output, $this->schemaName );

		if ( !$schema ) {
			$showMsg( 'generating schema' );
			// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.Found
			if ( !( $schema = $this->createSchema( $this->schemaName, $data ) ) ) {
				$showMsg( "couldn't save schema" );
				return false;
			}
		}

		if ( !\VisualData::isList( $data ) ) {
			$data = [ $data ];
		}

		$databaseManager = new DatabaseManager();
		$submitForm = new SubmitForm( $this->user, $this->context );
		$this->importer = \VisualData::getImporter();

		// @TODO MW 1.42
		if ( !$this->importer ) {
			return;
		}

		$n = 0;
		foreach ( $data as $key => $value ) {
			$flatten = $databaseManager->prepareData( $schema, $value );
			$titleText = $submitForm->replacePageNameFormula( $flatten, $pagenameFormula, $properties );

			$title_ = Title::newFromText( $titleText );
			if ( !$title_->canExist() ) {
				$showMsg( 'wrong title ' . $titleText );
				continue;
			}

			$pagename = $this->createArticle( $title_, $value );
			$showMsg( 'saving article: ' . $pagename );
			$entries = $databaseManager->recordProperties( 'ImportData', $title_, $flatten, $errors );

			$showMsg( "$entries entries created for article $pagename" );
			$n++;
			if ( $this->limit !== false && $n === $this->limit ) {
				break;
			}
		}
		return true;
	}

	/**
	 * @param Title $title
	 * @param array $data
	 * @return string
	 */
	public function createArticle( $title, $data ) {
		$obj = [
			'schemas' => [
				$this->schemaName => $data
			]
		];

		$contents = [
			[
				'role' => $this->mainSlot ? SlotRecord::MAIN : SLOT_ROLE_VISUALDATA_JSONDATA,
				'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
				'text' => json_encode( $obj, JSON_PRETTY_PRINT )
			],
		];

		if ( !$this->mainSlot ) {
			array_unshift( $contents, [
				'role' => SlotRecord::MAIN,
				'model' => 'wikitext',
				'text' => ''
			] );
		}

		$pagename = $title->getFullText();

		try {
			$this->importer->doImportSelf( $pagename, $contents );
		} catch ( Exception $e ) {
			$this->showMsg( "error: $pagename " . $e->getMessage() );
		}

		return $pagename;
	}

	/**
	 * @param string $name
	 * @param array $data
	 * @return array|bool
	 */
	private function createSchema( $name, $data ) {
		$schemaProcessor = new SchemaProcessor();
		$schemaProcessor->setOutput( $this->output );
		$schema = $schemaProcessor->generateFromData( $data, $name );
		$title = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $name );
		$statusOK = \VisualData::saveRevision( $this->user, $title, json_encode( $schema ) );
		if ( !$statusOK ) {
			return false;
		}
		return $schemaProcessor->processSchema( $schema, $name );
	}

}
