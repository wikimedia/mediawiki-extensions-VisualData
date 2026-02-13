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

use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\Extension\VisualData\DatabaseManager;
use MediaWiki\Extension\VisualData\ReplaceText\Search;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;

$IP = getenv( 'MW_INSTALL_PATH' );
if ( $IP === false ) {
	$IP = __DIR__ . '/../../..';
}
require_once "$IP/maintenance/Maintenance.php";

class RebuildData extends Maintenance {
	/** @var User */
	private $user;

	/** @var services */
	private $services;

	/** @var string */
	private $excludePrefix;

	/** @var bool */
	private $recastData;

	/** @var array */
	private $excludeSchemas;

	/** @var array */
	private $onlySchemas;

	/** @var DatabaseManager */
	private $databaseManager;

	public function __construct() {
		parent::__construct();
		$this->addDescription( 'rebuild data' );
		$this->requireExtension( 'VisualData' );

		// name,  description, required = false,
		//	withArg = false, shortName = false, multiOccurrence = false
		//	$this->addOption( 'format', 'import format (csv or json)', true, true );

		$this->addOption( 'exclude-prefix', 'exclude prefix', false, true );
		$this->addOption( 'recast-data', 'recast data', false, false );

		// @TODO this require selective deletion of data
		// in tables instead than dropping / creating them
		// $this->addOption( 'exclude-schemas', 'exclude schemas', false, true );
		// $this->addOption( 'only-schemas', 'only schemas', false, true );
	}

	/**
	 * inheritDoc
	 */
	public function execute() {
		$excludePrefix = $this->getOption( 'exclude-prefix' ) ?? '';
		$this->recastData = $this->getOption( 'recast-data' ) ?? false;

		// $excludeSchemas = $this->getOption( 'exclude-schemas' ) ?? '';
		// $onlySchemas = $this->getOption( 'only-schemas' ) ?? '';
		$excludeSchemas = '';
		$onlySchemas = '';

		// @see https://phabricator.wikimedia.org/T387008
		$this->excludePrefix = \VisualData::splitString( $excludePrefix );
		$this->excludeSchemas = \VisualData::splitString( $excludeSchemas );
		$this->onlySchemas = \VisualData::splitString( $onlySchemas );

		$this->services = MediaWikiServices::getInstance();
		$this->db = \VisualData::getDB( DB_PRIMARY );
		$this->user = User::newSystemUser( 'Maintenance script', [ 'steal' => true ] );

		if ( !count( $this->excludeSchemas ) && !count( $this->onlySchemas ) ) {
			$this->dropTables();
			$this->createTables();
		} else {
			// @TODO ...
		}

		$this->databaseManager = new DatabaseManager();

		$this->rebuildData();

		// *** unfortunately we cannot rely on tracking categories
		// and the standard maintenance/refreshLinks.php @see https://www.mediawiki.org/wiki/Manual:RefreshLinks.php
		// since tracking categories do not contain enough information
		$this->rebuildLinks();
	}

	private function rebuildLinks() {
		$search = '#v(isual)?data(form|print|query)';
		$selected_namespaces = null;
		$category = null;
		$prefix = null;
		$use_regex = true;

		// *** this could lead to "false-positive"
		// for instance when the parser function is in
		// comments, but does not cause harm
		$res = Search::doSearchQuery(
			$search,
			$selected_namespaces,
			$category,
			$prefix,
			$use_regex
		);

		$context = RequestContext::getMain();
		foreach ( $res as $row ) {
			$title_ = TitleClass::makeTitleSafe( $row->page_namespace, $row->page_title );
			if ( $title_ == null ) {
				continue;
			}

			foreach ( $this->excludePrefix as $prefix ) {
				if ( strpos( $title_->getFullText(), $prefix ) === 0 ) {
					continue 2;
				}
			}

			$wikiPage = \VisualData::getWikiPage( $title_ );

			if ( !$wikiPage ) {
				continue;
			}

			$wikiPage->doPurge();

			echo 'rebuilding links of ' . $title_->getText() . PHP_EOL;

			try {
				// or ParserOptions::newFromAnon()
				$parserOptions = ParserOptions::newFromUser( $this->user );
				$parserOutput = $wikiPage->getParserOutput( $parserOptions, null, true );

				if ( ( $parserOutput instanceof ParserOutput ) === false ) {
					echo 'no parser output' . PHP_EOL;
					continue;
				}
			} catch ( Exception $e ) {
				echo $e->getMessage() . PHP_EOL;
				continue;
			}

			\VisualData::handleLinks( $this->user, $parserOutput, $title_, $this->databaseManager );
		}
	}

	private function rebuildData() {
		$maxByPageId = $this->getMaxPageId();
		$context = RequestContext::getMain();

		// first select VisualData's schemas which
		// require to store initial data
		$conds = [
			'page_is_redirect' => 0,
			'page_namespace' => NS_VISUALDATASCHEMA
		];
		$options = [
			'USE INDEX' => ( version_compare( MW_VERSION, '1.36', '<' ) ? 'name_title' : 'page_name_title' )
		];

		$dbr = \VisualData::getDB( DB_PRIMARY );
		$res = $dbr->select(
			'page',
			[ 'page_namespace', 'page_title', 'page_id' ],
			$conds,
			__METHOD__,
			$options
		);

		$IDs = [];
		foreach ( $res as $row ) {
			$title_ = TitleClass::newFromRow( $row );
			$IDs[] = $title_->getArticleID();

			// ensure schema is not empty
			$text_ = \VisualData::getWikipageContent( $title_ );
			if ( empty( $text_ ) ) {
				\VisualData::deleteArticle( $title_, $this->user, 'no page' );
				continue;
			}

			$json = json_decode( $text_, true );
			if ( empty( $json ) ) {
				\VisualData::deleteArticle( $title_, $this->user, 'no contents' );
			}
		}

		$range = range( 1, $maxByPageId );

		usort( $range, static function ( $a, $b ) use ( $IDs ) {
			if ( in_array( $a, $IDs ) && !in_array( $b, $IDs ) ) {
				return -1;
			}
			return 0;
		} );

		foreach ( $range as $i ) {
			$title_ = TitleClass::newFromID( $i );

			if ( !$title_ || !$title_->isKnown() ) {
				continue;
			}

			echo "processing $i/$maxByPageId" . PHP_EOL;

			foreach ( $this->excludePrefix as $prefix ) {
				if ( strpos( $title_->getFullText(), $prefix ) === 0 ) {
					continue 2;
				}
			}

			$wikiPage = \VisualData::getWikiPage( $title_ );

			if ( !$wikiPage ) {
				continue;
			}

			$context->setTitle( $title_ );
			$revisionRecord = $wikiPage->getRevisionRecord();
			$this->handlePagePropertiesSlot( $wikiPage, $revisionRecord );

			[ $slotData, $slotName, $modelId ] = $this->getSlotData( $revisionRecord );

			if ( !$slotData ) {
				continue;
			}

			$content = $slotData->getContent();

			if ( empty( $content ) ) {
				continue;
			}

			$data = json_decode( $content->getNativeData(), true );

			if ( empty( $data ) ) {
				continue;
			}

			if ( $title_->getNamespace() === NS_VISUALDATASCHEMA ) {
				// *** use VisualDataHooks::onAfterImportPage instead
				// $this->databaseManager->createSchemaIdAndPrintouts( $data );
				echo 'rebuilding schema data for ' . $title_->getFullText() . PHP_EOL;
				continue;
			}

			if ( count( $this->excludeSchemas ) || count( $this->onlySchemas ) ) {
				if ( empty( $data['schemas'] ) ) {
					continue;
				}
				$schemas_ = array_keys( $data['schemas'] );
				if ( count( $schemas_ ) === 1 ) {
					if ( count( $this->onlySchemas ) && !in_array( $schemas_, $this->onlySchemas ) ) {
						continue;
					}
					if ( count( $this->excludeSchemas ) && in_array( $schemas_, $this->excludeSchemas ) ) {
						continue;
					}
				}
			}

			if ( $this->recastData ) {
				$this->saveSlotContent( $context, $wikiPage, $title_, $data, $slotName, $modelId );
			}

			echo 'rebuilding data for ' . $title_->getFullText() . PHP_EOL;

			$errors = [];
			if ( \VisualData::rebuildArticleData( $this->user, $title_, $data, $errors ) === false ) {
				echo '***error rebuildArticleData' . PHP_EOL;
				print_r( $errors );
				print_r( $data );
			}
		}
	}

	/**
	 * @param Context $context
	 * @param WikiPage $wikiPage
	 * @param Title $title
	 * @param array $data
	 * @param string $slotName
	 * @param string $modelId
	 * @return bool|void
	 */
	private function saveSlotContent( $context, $wikiPage, $title, $data, $slotName, $modelId ) {
		if ( !isset( $data['schemas'] ) ) {
			return;
		}
		echo 'recast data ' . $title->getFullText() . PHP_EOL;

		foreach ( $data['schemas'] as $schemaName => &$schemaData ) {
			$schema_ = \VisualData::getSchema( $context, $schemaName );
			$schemaData = DatabaseManager::castDataRec( $schema_, $schemaData );
		}

		$pageUpdater = $wikiPage->newPageUpdater( $this->user );
		$slotContent = ContentHandler::makeContent( json_encode( $data ), $title, $modelId );
		$pageUpdater->setContent( $slotName, $slotContent );
		$summary = '';
		$flags = EDIT_INTERNAL;
		$comment = CommentStoreComment::newUnsavedComment( $summary );
		$newRevision = $pageUpdater->saveRevision( $comment, $flags );
		$status = $pageUpdater->getStatus();

		return $status->isOK();
	}

	/**
	 * @param WikiPage $wikiPage
	 * @param RevisionRecord &$revisionRecord
	 */
	private function handlePagePropertiesSlot( $wikiPage, &$revisionRecord ) {
		$slots = $revisionRecord->getSlots()->getSlots();

		if ( !array_key_exists( 'pageproperties', $slots ) ) {
			return;
		}

		echo 'replacing slot pageproperties' . PHP_EOL;

		$slotContent = $slots['pageproperties']->getContent();
		$contents = $slotContent->getNativeData();

		$pageUpdater = $wikiPage->newPageUpdater( $this->user );
		$pageUpdater->removeSlot( 'pageproperties' );

		$title = $wikiPage->getTitle();
		$modelId = CONTENT_MODEL_VISUALDATA_JSONDATA;
		$slotContent = ContentHandler::makeContent( $contents, $title, $modelId );
		$pageUpdater->setContent( 'jsondata', $slotContent );

		$summary = 'VisualData update';
		$flags = EDIT_INTERNAL;
		$comment = CommentStoreComment::newUnsavedComment( $summary );
		$RevisionRecord = $pageUpdater->saveRevision( $comment, $flags );
	}

	/**
	 * @return int
	 */
	private function getMaxPageId() {
		return (int)$this->db->selectField(
			'page',
			'MAX(page_id)',
			'',
			__METHOD__
		);
	}

	/**
	 * return string|void
	 */
	private function createTables() {
		$shared = false;
		$updater = DatabaseUpdater::newForDB( $this->db, $shared, $this );
		$dbType = $updater->getDB()->getType();
		$base = __DIR__;
		foreach ( DatabaseManager::$tables as $tableName ) {
			$filename = "$base/../$dbType/$tableName.sql";
			if ( file_exists( $filename ) ) {
				$this->db->sourceFile( $filename );
				echo 'creating ' . $tableName . PHP_EOL;
			}
		}
	}

	/**
	 * return string|void
	 */
	private function dropTables() {
		foreach ( DatabaseManager::$tables as $tableName ) {
			echo 'dropping ' . $tableName . PHP_EOL;
			$res = $this->db->dropTable(
				$tableName
			);
		}
	}

	/**
	 * @param RevisionRecord $revisionRecord
	 * @return MediaWiki\Revision\SlotRecord
	 */
	private function getSlotData( $revisionRecord ) {
		$slots = $revisionRecord->getSlots()->getSlots();

		if ( array_key_exists( SLOT_ROLE_VISUALDATA_JSONDATA, $slots ) ) {
			return [ $slots[SLOT_ROLE_VISUALDATA_JSONDATA], SLOT_ROLE_VISUALDATA_JSONDATA, CONTENT_MODEL_VISUALDATA_JSONDATA ];
		}

		// rebuild only if main slot contains json data
		try {
			$modelId = $revisionRecord->getSlot( SlotRecord::MAIN )->getContent()->getContentHandler()->getModelID();
		} catch ( Exception $e ) {
			echo $e->getMessage() . PHP_EOL;
			return null;
		}
		if ( $modelId === 'json' || $modelId === CONTENT_MODEL_VISUALDATA_JSONDATA ) {
			return [ $slots[SlotRecord::MAIN], SlotRecord::MAIN, $modelId ];
		}

		return null;
	}

}

$maintClass = RebuildData::class;
require_once RUN_MAINTENANCE_IF_MAIN;
