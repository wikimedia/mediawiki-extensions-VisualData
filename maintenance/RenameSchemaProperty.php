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
 * @author freephile
 */

use MediaWiki\Context\RequestContext;
use MediaWiki\Extension\VisualData\DatabaseManager;
use MediaWiki\Revision\SlotRecord;

$IP = getenv( 'MW_INSTALL_PATH' );
if ( $IP === false ) {
	$IP = __DIR__ . '/../../..';
}

require_once "$IP/maintenance/Maintenance.php";

class RenameSchemaProperty extends Maintenance {
	/** @var User */
	private $user;

	/** @var DatabaseManager */
	private $databaseManager;

	public function __construct() {
		parent::__construct();
		$this->addDescription(
			'Rename a property key in VisualData stored records for a schema and rebuild mirrored query data.'
		);
		$this->requireExtension( 'VisualData' );

		$this->addOption( 'schema', 'Schema name to process.', false, true );
		$this->addOption( 'old-key', 'Existing property key to rename.', false, true );
		$this->addOption( 'new-key', 'New property key.', false, true );
		$this->addOption( 'prefix', 'Optional title prefix filter (for example: Tasks/).', false, true );
		$this->addOption( 'limit', 'Optional maximum number of pages to process.', false, true );
		$this->addOption( 'force', 'Overwrite new-key if it already exists.', false, false );
		$this->addOption( 'dry-run', 'Show what would change without writing revisions.', false, false );
	}

	/**
	 * @inheritDoc
	 */
	public function execute() {
		$schemaName = $this->getOption( 'schema', 'Task' );
		$oldKey = $this->getOption( 'old-key', 'comment' );
		$newKey = $this->getOption( 'new-key', 'task_detail' );
		$titlePrefix = $this->getOption( 'prefix', '' );
		$limit = (int)$this->getOption( 'limit', 0 );
		$force = (bool)$this->getOption( 'force', false );
		$dryRun = (bool)$this->getOption( 'dry-run', false );

		if ( $oldKey === $newKey ) {
			$this->fatalError( '--old-key and --new-key must be different.' );
		}

		$this->user = User::newSystemUser( 'Maintenance script', [ 'steal' => true ] );
		$this->databaseManager = new DatabaseManager();

		$titles = $this->databaseManager->pagesWithSchema( $schemaName );

		if ( $titlePrefix !== '' ) {
			$titles = array_values( array_filter(
				$titles,
				static function ( $title ) use ( $titlePrefix ) {
					return strpos( $title->getPrefixedText(), $titlePrefix ) === 0;
				}
			) );
		}

		if ( $limit > 0 ) {
			$titles = array_slice( $titles, 0, $limit );
		}

		$total = count( $titles );
		$this->output( "Found {$total} pages for schema '{$schemaName}'.\n" );

		$updated = 0;
		$skippedNoSchema = 0;
		$skippedNoOldKey = 0;
		$skippedConflict = 0;
		$errorsCount = 0;

		foreach ( $titles as $title ) {
			$titleText = $title->getPrefixedText();
			$jsonData = \VisualData::getJsonData( $title );

			if (
				!$jsonData ||
				empty( $jsonData['schemas'] ) ||
				!isset( $jsonData['schemas'][$schemaName] )
			) {
				$skippedNoSchema++;
				$this->output( "SKIP {$titleText}: schema payload not found in jsondata.\n" );
				continue;
			}

			$schemaPayload = $jsonData['schemas'][$schemaName];

			if (
				!is_array( $schemaPayload ) ||
				!array_key_exists( $oldKey, $schemaPayload )
			) {
				$skippedNoOldKey++;
				$this->output( "SKIP {$titleText}: key '{$oldKey}' not present.\n" );
				continue;
			}

			if ( array_key_exists( $newKey, $schemaPayload ) && !$force ) {
				$skippedConflict++;
				$this->output(
					"SKIP {$titleText}: key '{$newKey}' already exists (use --force to overwrite).\n"
				);
				continue;
			}

			$newValue = $schemaPayload[$oldKey];
			$jsonData['schemas'][$schemaName][$newKey] = $newValue;
			unset( $jsonData['schemas'][$schemaName][$oldKey] );

			$this->migrateUntransformedPath(
				$jsonData,
				$schemaName,
				$oldKey,
				$newKey,
				$force
			);

			if ( $dryRun ) {
				$updated++;
				$this->output(
					"DRY-RUN {$titleText}: would rename {$schemaName}.{$oldKey} -> {$schemaName}.{$newKey}.\n"
				);
				continue;
			}

			$errors = [];
			if ( !$this->saveJsonDataInternal( $title, $jsonData, $errors ) ) {
				$errorsCount++;
				$this->output( "ERROR {$titleText}: internal slot update failed.\n" );

				if ( count( $errors ) ) {
					$this->output( '  - ' . implode( ' | ', $errors ) . "\n" );
				}
				continue;
			}

			$errors = [];
			$context = RequestContext::newExtraneousContext( $title );

			$rebuildStatus = $this->rebuildArticleDataInternal(
				$context,
				$title,
				$jsonData,
				$errors
			);

			if ( $rebuildStatus === false ) {
				$errorsCount++;
				$this->output( "ERROR {$titleText}: rebuildArticleData failed.\n" );

				if ( count( $errors ) ) {
					$this->output( '  - ' . implode( ' | ', $errors ) . "\n" );
				}
				continue;
			}

			$updated++;
			$this->output(
				"UPDATED {$titleText}: {$schemaName}.{$oldKey} -> {$schemaName}.{$newKey}.\n"
			);
		}

		$this->output( "\nSummary:\n" );
		$this->output( "  Updated: {$updated}\n" );
		$this->output( "  Skipped (no schema payload): {$skippedNoSchema}\n" );
		$this->output( "  Skipped (missing old key): {$skippedNoOldKey}\n" );
		$this->output( "  Skipped (new key conflict): {$skippedConflict}\n" );
		$this->output( "  Errors: {$errorsCount}\n" );

		if ( $dryRun ) {
			$this->output( "\nDry run mode was enabled. No pages were modified.\n" );
		}
	}

	/**
	 * @param array &$jsonData
	 * @param string $schemaName
	 * @param string $oldKey
	 * @param string $newKey
	 * @param bool $force
	 */
	private function migrateUntransformedPath(
		array &$jsonData,
		$schemaName,
		$oldKey,
		$newKey,
		$force
	) {
		if (
			empty( $jsonData['schemas-data'] ) ||
			empty( $jsonData['schemas-data']['untransformed'] ) ||
			!is_array( $jsonData['schemas-data']['untransformed'] )
		) {
			return;
		}

		$oldPath = $schemaName . '/' . $oldKey;
		$newPath = $schemaName . '/' . $newKey;

		if ( !array_key_exists( $oldPath, $jsonData['schemas-data']['untransformed'] ) ) {
			return;
		}

		if ( array_key_exists( $newPath, $jsonData['schemas-data']['untransformed'] ) && !$force ) {
			return;
		}

		$jsonData['schemas-data']['untransformed'][$newPath]
			= $jsonData['schemas-data']['untransformed'][$oldPath];

		unset( $jsonData['schemas-data']['untransformed'][$oldPath] );
	}

	/**
	 * @param Title $title
	 * @param array $jsonData
	 * @param array &$errors
	 * @return bool
	 */
	private function saveJsonDataInternal( $title, array $jsonData, array &$errors ) {
		$wikiPage = \VisualData::getWikiPage( $title );

		if ( !$wikiPage ) {
			$errors[] = 'no wiki page';
			return false;
		}

		$targetSlot = \VisualData::getTargetSlot( $title, SlotRecord::MAIN );
		$slotContent = ContentHandler::makeContent(
			json_encode( $jsonData ),
			$title,
			CONTENT_MODEL_VISUALDATA_JSONDATA
		);

		$pageUpdater = $wikiPage->newPageUpdater( $this->user );
		$pageUpdater->setContent( $targetSlot, $slotContent );

		$comment = CommentStoreComment::newUnsavedComment(
			'VisualData rename schema property'
		);

		$revisionRecord = $pageUpdater->saveRevision( $comment, EDIT_INTERNAL );

		if ( $revisionRecord === null ) {
			$errors[] = 'saveRevision returned null';
			return false;
		}

		return true;
	}

	/**
	 * @param Context $context
	 * @param Title $title
	 * @param array $data
	 * @param array &$errors
	 * @return bool
	 */
	private function rebuildArticleDataInternal( $context, $title, array $data, array &$errors ) {
		if ( empty( $data['schemas'] ) ) {
			return;
		}

		$schemas = array_keys( $data['schemas'] );
		$schemas = \VisualData::getSchemas( $context, $schemas, true );

		$databaseManager = new DatabaseManager();
		$flatten = [];

		foreach ( $data['schemas'] as $schemaName => $value ) {
			if ( !array_key_exists( $schemaName, $schemas ) ) {
				continue;
			}

			$flatten_ = $databaseManager->prepareData( $schemas[$schemaName], $value );

			if ( $flatten_ === false ) {
				$errors[] = 'error processing schema';
				return false;
			}

			$flatten = array_merge( $flatten, $flatten_ );
		}

		$databaseManager->recordProperties(
			'rename-schema-property',
			$title,
			$flatten,
			$errors
		);

		return true;
	}
}

$maintClass = RenameSchemaProperty::class;
require_once RUN_MAINTENANCE_IF_MAIN;
