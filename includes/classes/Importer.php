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

	/** @var Importer|Importer1_35 */
	private $importer;

	/** @var array */
	private $options = [];

	/** @var callback */
	private $showMsg;

	/**
	 * @param User $user
	 * @param Context $context
	 * @param string $schemaName
	 * @param array|null $options []
	 */
	public function __construct( $user, $context, $schemaName, $options = [] ) {
		$this->user = $user;
		$this->context = $context;
		$this->schemaName = $schemaName;
		$this->options = $options;

		$options = [ 'main-slot', 'limit', 'category-field' ];
		foreach ( $options as $value ) {
			if ( !isset( $this->options[$value] ) ) {
				$this->options[$value] = false;
			}
		}
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
		$schema = \VisualData::getSchema( $this->context, $this->schemaName );

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

			$showMsg( 'saving article: ' . $title_->getFullText() );
			$pagename = $this->createArticle( $title_, $value );

			$entries = $databaseManager->recordProperties( 'ImportData', $title_, $flatten, $errors );
			$showMsg( "$entries entries created for article $pagename" );
			$n++;
			if ( $this->options['limit'] !== false && $n === $this->options['limit'] ) {
				break;
			}
		}

		$showMsg( "$n pages imported" );
		return true;
	}

	/**
	 * @param Title $title
	 * @param array $data
	 * @return string
	 */
	public function createArticle( $title, $data ) {
		$categories = [];
		if ( !empty( $this->options['category-field'] ) ) {
			if ( isset( $data[$this->options['category-field']] ) ) {
				$categories = $data[$this->options['category-field']];
			}
			unset( $data[$this->options['category-field']] );
		}

		$obj = [
			'schemas' => [
				$this->schemaName => $data
			]
		];

		if ( !empty( $categories ) ) {
			$obj['categories'] = $categories;
		}

		$contents = [
			[
				'role' => $this->options['main-slot'] ? SlotRecord::MAIN : SLOT_ROLE_VISUALDATA_JSONDATA,
				'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
				'text' => json_encode( $obj, JSON_PRETTY_PRINT )
			],
		];

		if ( !$this->options['main-slot'] ) {
			array_unshift( $contents, [
				'role' => SlotRecord::MAIN,
				'model' => 'wikitext',
				'text' => ''
			] );
		}

		$pagename = $title->getFullText();

		try {
			$this->importer->doImportSelf( $pagename, $contents );
		} catch ( \Exception $e ) {
			call_user_func( $this->showMsg, "error: $pagename " . $e->getMessage() );
		}

		return $pagename;
	}

	/**
	 * @param string $name
	 * @param array $data
	 * @return array|bool
	 */
	private function createSchema( $name, $data ) {
		$schemaProcessor = new SchemaProcessor( $this->context );
		$schema = $schemaProcessor->generateFromData( $data, $name );
		$title = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $name );
		$statusOK = \VisualData::saveRevision( $this->user, $title, json_encode( $schema ) );
		if ( !$statusOK ) {
			return false;
		}
		return $schemaProcessor->processSchema( $schema, $name );
	}

}
