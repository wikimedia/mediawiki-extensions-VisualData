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

use MediaWiki\MediaWikiServices;

$IP = getenv( 'MW_INSTALL_PATH' );
if ( $IP === false ) {
	$IP = __DIR__ . '/../../..';
}
require_once "$IP/maintenance/Maintenance.php";

if ( is_readable( __DIR__ . '/../vendor/autoload.php' ) ) {
	include_once __DIR__ . '/../vendor/autoload.php';
}

class DeleteRegex extends Maintenance {
	/** @var User */
	private $user;

	/** @var limit */
	private $limit;

	public function __construct() {
		parent::__construct();
		$this->addDescription( 'delete regex' );
		$this->requireExtension( 'VisualData' );

		// name,  description, required = false,
		//	withArg = false, shortName = false, multiOccurrence = false
		//	$this->addOption( 'format', 'import format (csv or json)', true, true );

		$this->addOption( 'regex', 'regex', true, true );
		$this->addOption( 'delete', 'delete', false, false );
		$this->addOption( 'namespace', 'namespace', false, true );
		$this->addOption( 'limit', 'limit pages to be imported', false, true );
	}

	/**
	 * @return null
	 */
	private function getRequestId() {
		return null;
	}

	/**
	 * inheritDoc
	 * @return string|void
	 */
	public function execute() {
		$limit = $this->getOption( 'limit' ) ?? false;
		$regex = $this->getOption( 'regex' ) ?? '';
		$namespace = $this->getOption( 'namespace' ) ?? '';
		$delete = $this->getOption( 'delete' ) ?? false;

		if ( empty( $regex ) ) {
			return 'no regex';
		}

		$dbr = \VisualData::getDB( DB_PRIMARY );

		$user = User::newSystemUser( 'Maintenance script', [ 'steal' => true ] );

		$this->user = $user;

		$conds = [
			'page_is_redirect' => 0
		];

		if ( !empty( $namespace ) ) {
			if ( !is_numeric( $namespace ) ) {
				$formattedNamespaces = MediaWikiServices::getInstance()
					->getContentLanguage()->getFormattedNamespaces();

				$ns = array_search( $namespace, $formattedNamespaces );
			} else {
				$ns = $namespace;
			}
			if ( !empty( $ns ) ) {
				$conds['page_namespace'] = $ns;
			}
		}

		$conds[] = 'page_title REGEXP ' . $dbr->addQuotes( $regex );

		$options = [
			'USE INDEX' => ( version_compare( MW_VERSION, '1.36', '<' ) ? 'name_title' : 'page_name_title' )
		];

		if ( $limit !== false ) {
			$options['LIMIT'] = (int)$limit;
		}

		$res = $dbr->select(
			'page',
			[ 'page_namespace', 'page_title', 'page_id' ],
			$conds,
			__METHOD__,
			$options
		);

		if ( !$res->numRows() ) {
			return 'no pages';
		}

		// @see DeleteBatch
		$services = MediaWikiServices::getInstance();
		$wikiPageFactory = $services->getWikiPageFactory();
		$delPageFactory = $services->getDeletePageFactory();
		$reason = 'DeleteRegex';

		$ret = [];
		foreach ( $res as $row ) {
			$title = Title::newFromRow( $row );
			if ( !$delete ) {
				echo 'matching ' . $title->getFullText() . PHP_EOL;
				continue;
			}
			echo 'deleting ' . $title->getFullText() . PHP_EOL;

			$wikiPage = $wikiPageFactory->newFromTitle( $title );

			if ( !$wikiPage ) {
				echo 'no wikipage' . PHP_EOL;
				continue;
			}

			$delPage = $delPageFactory->newDeletePage( $wikiPage, $user );
			$status = $delPage
				->forceImmediate( true )
				->deleteUnsafe( $reason );

			if ( $status->isOK() ) {
				DeferredUpdates::doUpdates();
				echo 'done' . PHP_EOL;

			} else {
				echo 'FAILED' . PHP_EOL;
			}
		}
	}

}

$maintClass = DeleteRegex::class;
require_once RUN_MAINTENANCE_IF_MAIN;
