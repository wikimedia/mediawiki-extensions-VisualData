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
 * @copyright Copyright ©2025, https://wikisphere.org
 */

// use MediaWiki\MediaWikiServices;
use MediaWiki\Extension\VisualData\DatabaseManager;
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

class Uninstall extends Maintenance {
	/** @var User */
	private $user;

	/** @var array */
	private $output;

	/** @var bool */
	private $uninstall;

	/** @var bool */
	private $removeMainSlotJsondata;

	/** @var int */
	private $limit;

	/** @var string */
	private $filename;

	public function __construct() {
		parent::__construct();
		$this->addDescription( 'uninstall' );
		$this->requireExtension( 'VisualData' );

		// name,  description, required = false, withArg = false,
		// shortName = false, multiOccurrence = false
		// $this->addOption( 'format', 'import format (csv or json)', true, true );

		// @see https://www.mediawiki.org/wiki/Extension_talk:VisualData#c-Thomas-topway-it-20250205192800-TaylanKammer-20241222154800
		//	$this->addOption( 'remove-json-slot', 'remove json slot', false, false );
		$this->addOption( 'output', 'output file', true, true );
		$this->addOption( 'limit', 'limit', false, true );
		$this->addOption( 'uninstall', 'uninstall', false, false );
		$this->addOption( 'remove-main-slot-jsondata', 'remove main slot jsondata', false, false );
	}

	/**
	 * inheritDoc
	 */
	public function execute() {
		// $this->removeJsonSlot = $this->hasOption( 'remove-json-slot' ) ?? false;
		$this->limit = (int)$this->getOption( 'limit' ) ?? -1;
		$this->uninstall = $this->hasOption( 'uninstall' ) ?? false;
		$this->removeMainSlotJsondata = $this->hasOption( 'remove-main-slot-jsondata' ) ?? false;

		$this->db = \VisualData::getDB( DB_PRIMARY );
		$this->user = User::newSystemUser( 'Maintenance script', [ 'steal' => true ] );

		$this->filename = $filename = $_SERVER['HOME'] . '/visualdata_export_' . date( 'm-d-Y_hia' ) . '.json';

		// do this in 2 different passes, otherwise if the script
		// halts data will be partially lost
		if ( $this->processData( 'export' ) !== false ) {
			if ( $this->uninstall ) {
				$this->processData( 'delete' );
				if ( $this->limit === -1 ) {
					$this->dropTables();
				}
			}
			echo "data saved to {$this->filename}" . PHP_EOL;
		}
	}

	/**
	 * @param string $name
	 * @return bool|void
	 */
	private function processData( $name ) {
		$maxByPageId = $this->getMaxPageId();
		$context = RequestContext::getMain();

		// @see https://www.mediawiki.org/wiki/Extension_talk:VisualData#c-Thomas-topway-it-20250205192800-TaylanKammer-20241222154800
		// $services = MediaWikiServices::getInstance();
		// $slotRoleRegistry = $services->getSlotRoleRegistry();
		// $slotRoleRegistry->defineRoleWithModel( SLOT_ROLE_VISUALDATA_JSONDATA, 'json');

		$n = 0;
		for ( $i = 1; $i < $maxByPageId; $i++ ) {
			if ( $this->limit !== -1 && $n > $this->limit ) {
				break;
			}
			$title_ = Title::newFromID( $i );

			if ( !$title_ || !$title_->isKnown() ) {
				continue;
			}

			echo "processing $name $i/$maxByPageId" . PHP_EOL;

			$wikiPage = \VisualData::getWikiPage( $title_ );
			if ( !$wikiPage ) {
				continue;
			}

			$context->setTitle( $title_ );

			$role = null;
			$slots = [];
			$json = $this->getJsonData( $wikiPage, $role, $slots );

			if ( $name === 'delete' ) {
				$this->convertHtmlContentModel( $title_, $wikiPage, $slots );
			}

			if ( is_array( $json ) ) {
				echo 'found json data for article ' . $title_->getFullText() . PHP_EOL;
				$n++;
				if ( $name === 'export' ) {
					call_user_func( [ $this, 'callbackExport' ], $title_, $wikiPage, $json );

				} elseif ( $name === 'delete' ) {
					call_user_func( [ $this, 'callbackDelete' ], $title_, $wikiPage, $role, $json );
				}
			}
		}

		if ( $name === 'export' ) {
			return file_put_contents( $this->filename,
				json_encode( $this->output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
			);
		}
	}

	/**
	 * @param Title $title
	 * @param WikiPage $wikiPage
	 * @param SlotRecord[] $slots
	 * @return bool
	 */
	private function convertHtmlContentModel( $title, $wikiPage, $slots ) {
		foreach ( $slots as $role => $slot ) {
			$content = $slots[$role]->getContent();
			$modelId = $content->getContentHandler()->getModelID();

			if ( $modelId === CONTENT_MODEL_VISUALDATA_HTML ) {
				echo 'convert html content model to text for article ' . $title->getFullText() . PHP_EOL;
				$pageUpdater = $wikiPage->newPageUpdater( $this->user );
				$modelId = 'text';
				$contents = $content->getNativeData();
				$slotContent = ContentHandler::makeContent( $contents, $title, $modelId );
				$pageUpdater->setContent( $role, $slotContent );
				$summary = 'VisualData uninstall convert html content model to text';
				$flags = EDIT_INTERNAL;
				$comment = CommentStoreComment::newUnsavedComment( $summary );
				$revisionRecord = $pageUpdater->saveRevision( $comment, $flags );
				DeferredUpdates::doUpdates();
				return true;
			}
		}

		return false;
	}

	/**
	 * @param Title $title
	 * @param WikiPage $wikiPage
	 * @param arrat $json
	 * @return false|array
	 */
	private function callbackExport( $title, $wikiPage, $json ) {
		$titleStr = $title->getFullText();
		$this->output[$titleStr] = $json;
	}

	/**
	 * @param Title $title
	 * @param WikiPage $wikiPage
	 * @param string $role
	 * @param array $json
	 */
	private function callbackDelete( $title, $wikiPage, $role, $json ) {
		if ( $role === SlotRecord::MAIN && $this->removeMainSlotJsondata ) {
			$reason = 'visualdata uninstall delete json data';
			\VisualData::deletePage( $wikiPage, $this->user, $reason );
			echo 'delete article ' . $title->getFullText() . PHP_EOL;
			return;
		}

		$pageUpdater = $wikiPage->newPageUpdater( $this->user );

		if ( $role !== SlotRecord::MAIN ) {
			echo 'remove json-data slot for article ' . $title->getFullText() . PHP_EOL;
			$pageUpdater->removeSlot( $role );
			$summary = 'VisualData uninstall remove slot';

		} else {
			echo 'convert visualdata-jsondata content model to json for article ' . $title->getFullText() . PHP_EOL;
			$modelId = 'json';
			$slotContent = ContentHandler::makeContent( json_encode( $json ), $title, $modelId );
			$pageUpdater->setContent( $role, $slotContent );
			$summary = 'VisualData uninstall convert slot to json';
		}

		$flags = EDIT_INTERNAL;
		$comment = CommentStoreComment::newUnsavedComment( $summary );
		$revisionRecord = $pageUpdater->saveRevision( $comment, $flags );
		DeferredUpdates::doUpdates();
	}

	/**
	 * @param WikiPage $wikiPage
	 * @param string &$role
	 * @param SlotRecord[] &$slots
	 * @return false|null|array
	 */
	private function getJsonData( $wikiPage, &$role, &$slots ) {
		$revisionRecord = $wikiPage->getRevisionRecord();
		if ( !$revisionRecord ) {
			return false;
		}

		$slots = $revisionRecord->getSlots()->getSlots();

		if ( !is_array( $slots ) ) {
			return false;
		}

		$getContentAndRole = static function ( $slots ) {
			foreach ( $slots as $role => $slot ) {
				$content = $slots[$role]->getContent();
				$modelId = $content->getContentHandler()->getModelID();

				if ( $role === SLOT_ROLE_VISUALDATA_JSONDATA
					|| $modelId === CONTENT_MODEL_VISUALDATA_JSONDATA
				) {
					return [ $content, $role ];
				}
			}
			return [ null, null ];
		};

		[ $content, $role ] = $getContentAndRole( $slots );

		if ( !$role ) {
			return null;
		}

		$contents = $content->getNativeData();
		return ( !empty( $contents ) ? json_decode( $contents, true ) : null );
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
	private function dropTables() {
		foreach ( DatabaseManager::$tables as $tableName ) {
			echo 'dropping ' . $tableName . PHP_EOL;
			$res = $this->db->dropTable(
				$tableName
			);
		}
	}

}

$maintClass = Uninstall::class;
require_once RUN_MAINTENANCE_IF_MAIN;
