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

use MediaWiki\Extension\VisualData\DatabaseManager;
use MediaWiki\Extension\VisualData\ReplaceText\Search;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;

$IP = getenv( 'MW_INSTALL_PATH' );
if ( $IP === false ) {
	$IP = __DIR__ . '/../../..';
}
require_once "$IP/maintenance/Maintenance.php";

if ( is_readable( __DIR__ . '/../vendor/autoload.php' ) ) {
	include_once __DIR__ . '/../vendor/autoload.php';
}

include_once __DIR__ . '/ReplaceText/Search.php';

class RebuildData extends Maintenance {
	/** @var User */
	private $user;

	/** @var int */
	private $limit;

	/** @var services */
	private $services;

	/** @var string */
	private $excludePrefix;

	/** @var array */
	private $excludeSchemas;

	/** @var array */
	private $onlySchemas;

	public function __construct() {
		parent::__construct();
		$this->addDescription( 'rebuild data' );
		$this->requireExtension( 'VisualData' );

		// name,  description, required = false,
		//	withArg = false, shortName = false, multiOccurrence = false
		//	$this->addOption( 'format', 'import format (csv or json)', true, true );

		$this->addOption( 'limit', 'limit', false, true );
		$this->addOption( 'exclude-prefix', 'exclude prefix', false, true );
		$this->addOption( 'exclude-schemas', 'exclude schemas', false, true );
		$this->addOption( 'only-schemas', 'only schemas', false, true );
	}

	/**
	 * inheritDoc
	 */
	public function execute() {
		$limit = $this->getOption( 'limit' ) ?? false;
		$this->excludePrefix = $this->getOption( 'exclude-prefix' ) ?? '';
		$this->excludeSchemas = $this->getOption( 'exclude-schemas' ) ?? '';
		$this->onlySchemas = $this->getOption( 'only-schemas' ) ?? '';

		$this->excludePrefix = preg_split( '/\s*,\s*/', $this->excludePrefix, -1, PREG_SPLIT_NO_EMPTY );
		$this->excludeSchemas = preg_split( '/\s*,\s*/', $this->excludeSchemas, -1, PREG_SPLIT_NO_EMPTY );
		$this->onlySchemas = preg_split( '/\s*,\s*/', $this->onlySchemas, -1, PREG_SPLIT_NO_EMPTY );

		$this->services = MediaWikiServices::getInstance();
		$this->db = wfGetDB( DB_MASTER );
		$this->user = User::newSystemUser( 'Maintenance script', [ 'steal' => true ] );

		$this->dropTables();
		$this->createTables();
		$this->rebuildData();
		$this->rebuildLinks();
	}

	private function rebuildLinks() {
		$databaseManager = new DatabaseManager();
		$context = RequestContext::getMain();
		$maxByPageId = $this->getMaxPageId();

		for ( $i = 0; $i <= $maxByPageId; $i++ ) {
			$title = Title::newFromID( $i );

			if ( !$title || !$title->isKnown() ) {
				continue;
			}

			foreach ( $this->excludePrefix as $prefix ) {
				if ( strpos( $title->getFullText(), $prefix ) === 0 ) {
					continue 2;
				}
			}

			$wikiPage = \VisualData::getWikiPage( $title );

			if ( !$wikiPage ) {
				continue;
			}

			echo 'rebuilding links of ' . $title->getFullText() . PHP_EOL;

			try {
				// or $output->parserOptions();
				$parserOptions = ParserOptions::newFromAnon();
				$parserOutput = $wikiPage->getParserOutput( $parserOptions, null, true );
			} catch ( Exception $e ) {
				echo $e->getMessage() . PHP_EOL;
				continue;
			}

			\VisualData::handleLinks( $parserOutput, $title, $databaseManager );
		}
	}

	private function rebuildLinks_() {
		$search = '#v(isual)?data(form|print|query)';
		$selected_namespaces = null;
		$category = null;
		$prefix = null;
		$use_regex = true;

		$res = Search::doSearchQuery(
			$search,
			$selected_namespaces,
			$category,
			$prefix,
			$use_regex
		);

		$context = RequestContext::getMain();
		foreach ( $res as $row ) {
			$title = Title::makeTitleSafe( $row->page_namespace, $row->page_title );
			if ( $title == null ) {
				continue;
			}

			foreach ( $this->excludePrefix as $prefix ) {
				if ( strpos( $title->getFullText(), $prefix ) === 0 ) {
					continue 2;
				}
			}

			$wikiPage = \VisualData::getWikiPage( $title );

			if ( !$wikiPage ) {
				continue;
			}

			$wikiPage->doPurge();

			echo 'rebuilding links of ' . $title->getText() . PHP_EOL;

			// @ATTENTION required to execute
			// onOutputPageParserOutput, alternatively use
			// addParserOutputMetadata @see McrUndoAction

			$context->setTitle( $title );
			try {
				$article = new Article( $title );
				$article->render();
			} catch ( Exception $e ) {
				echo $e->getMessage() . PHP_EOL;
			}

			$transclusionTargets = \VisualData::getTransclusionTargets( $title );

			foreach ( $transclusionTargets as $title_ ) {
				echo 'rebuilding links of (transclusion target) ' . $title_->getText() . PHP_EOL;

				$wikiPage_ = \VisualData::getWikiPage( $title_ );
				$wikiPage_->doPurge();

				$context->setTitle( $title_ );
				try {
					$article_ = new Article( $title_ );
					$article_->render();
				} catch ( Exception $e ) {
					echo $e->getMessage() . PHP_EOL;
				}
			}
		}
	}

	private function rebuildData() {
		$context = RequestContext::getMain();
		$maxByPageId = $this->getMaxPageId();

		for ( $i = 0; $i <= $maxByPageId; $i++ ) {
			$title = Title::newFromID( $i );

			if ( !$title || !$title->isKnown() ) {
				continue;
			}

			echo "processing $i/$maxByPageId" . PHP_EOL;

			foreach ( $this->excludePrefix as $prefix ) {
				if ( strpos( $title->getFullText(), $prefix ) === 0 ) {
					continue 2;
				}
			}

			$wikiPage = \VisualData::getWikiPage( $title );

			if ( !$wikiPage ) {
				continue;
			}

			$revisionRecord = $wikiPage->getRevisionRecord();

			$this->handlePagePropertiesSlot( $wikiPage, $revisionRecord );

			$slotData = $this->getSlotData( $revisionRecord );

			if ( !$slotData ) {
				continue;
			}

			echo 'rebuilding data for ' . $title->getFullText() . PHP_EOL;

			$content = $slotData->getContent();
			$errors = [];
			\VisualData::rebuildArticleDataFromSlot( $title, $content, $errors );
		}
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

		$summary = "VisualData update";
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
			return $slots[SLOT_ROLE_VISUALDATA_JSONDATA];
		}

		// rebuild only if main slot contains json data

		try {
			$modelId = $revisionRecord->getSlot( SlotRecord::MAIN )->getContent()->getContentHandler()->getModelID();
		} catch ( Exception $e ) {
			echo $e->getMessage() . PHP_EOL;
			return null;
		}
		if ( $modelId === 'json' || $modelId === CONTENT_MODEL_VISUALDATA_JSONDATA ) {
			return $slots[SlotRecord::MAIN];
		}

		return null;
	}

}

$maintClass = RebuildData::class;
require_once RUN_MAINTENANCE_IF_MAIN;
