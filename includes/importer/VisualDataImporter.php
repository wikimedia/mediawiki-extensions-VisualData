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

use MediaWiki\Cache\CacheKeyHelper;
use MediaWiki\Content\IContentHandlerFactory;
use MediaWiki\HookContainer\HookContainer;
use MediaWiki\HookContainer\HookRunner;
use MediaWiki\MediaWikiServices;
use MediaWiki\Page\PageIdentity;
use MediaWiki\Page\WikiPageFactory;
use MediaWiki\Permissions\PermissionManager;
use MediaWiki\Revision\SlotRecord;
use MediaWiki\Revision\SlotRoleRegistry;

// @see includes/import/WikiImporter.php
// *** all the required private vars and method are copied from WikiImporter
class VisualDataImporter extends WikiImporter {
	/** @var title_text */
	public $title_text;

	/** @var contents */
	private $contents;

	/** @var errorMessage */
	private $errorMessages = [];

	//////////////////////// required private vars ///////////////////

	/** @var callable|null */
	private $mRevisionCallback;

	/** @var array|null */
	private $foreignNamespaces = null;

	/** @var callable */
	private $mLogItemCallback;

	/** @var callable|null */
	private $mPageCallback;

	/** @var callable|null */
	private $mPageOutCallback;

	/** @var callable|null */
	private $mNoticeCallback;

	/** @var bool */
	private $mNoUpdates = false;

	/** @var Config */
	private $config;

	/** @var ImportTitleFactory */
	private $importTitleFactory;

	/** @var HookRunner */
	private $hookRunner;

	/** @var array */
	private $countableCache = [];

	/** @var bool */
	private $disableStatisticsUpdate = false;

	/** @var ExternalUserNames */
	private $externalUserNames;

	/** @var Language */
	private $contentLanguage;

	/** @var NamespaceInfo */
	private $namespaceInfo;

	/** @var TitleFactory */
	private $titleFactory;

	/** @var WikiPageFactory */
	public $wikiPageFactory;

	/** @var UploadRevisionImporter */
	private $uploadRevisionImporter;

	/** @var PermissionManager */
	private $permissionManager;

	/** @var IContentHandlerFactory */
	private $contentHandlerFactory;

	/** @var SlotRoleRegistry */
	private $slotRoleRegistry;

	/**
	 * @inheritDoc
	 */
	public function __construct(
		Config $config,
		HookContainer $hookContainer,
		Language $contentLanguage,
		NamespaceInfo $namespaceInfo,
		TitleFactory $titleFactory,
		WikiPageFactory $wikiPageFactory,
		UploadRevisionImporter $uploadRevisionImporter,
		PermissionManager $permissionManager,
		IContentHandlerFactory $contentHandlerFactory,
		SlotRoleRegistry $slotRoleRegistry
	) {
		// $this->reader = new XMLReader();
		$this->config = $config;
		$this->hookRunner = new HookRunner( $hookContainer );
		$this->contentLanguage = $contentLanguage;
		$this->namespaceInfo = $namespaceInfo;
		$this->titleFactory = $titleFactory;
		$this->wikiPageFactory = $wikiPageFactory;
		$this->uploadRevisionImporter = $uploadRevisionImporter;
		$this->permissionManager = $permissionManager;
		$this->contentHandlerFactory = $contentHandlerFactory;
		$this->slotRoleRegistry = $slotRoleRegistry;

		// Default callbacks
		$this->setPageCallback( [ $this, 'beforeImportPage' ] );
		$this->setRevisionCallback( [ $this, "importRevision" ] );
		$this->setUploadCallback( [ $this, 'importUpload' ] );
		$this->setLogItemCallback( [ $this, 'importLogItem' ] );
		$this->setPageOutCallback( [ $this, 'finishImportPage' ] );

		$this->importTitleFactory = new NaiveImportTitleFactory(
			$this->contentLanguage,
			$this->namespaceInfo,
			$this->titleFactory
		);
		$this->externalUserNames = new ExternalUserNames( 'imported', false );
	}

	/**
	 * @param Title $title_text
	 * @param array $contents
	 */
	public function doImportSelf( $title_text, $contents ) {
		$this->title_text = $title_text;
		$this->contents = $contents;

		$this->handlePageSelf();
	}

	/**
	 * @param Title $title
	 */
	public function doDeferredUpdates( $title ) {
		// *** important !!
		// @see JobRunner -> doExecuteJob
		DeferredUpdates::doUpdates();

		if ( $title->getArticleID() === 0 ) {
			throw new MWException( 'article not saved' );
		}
	}

	/**
	 * @return string
	 */
	public function getErrorMessages() {
		return $this->errorMessages;
	}

	/**
	 * @param string $text
	 * @param string|null $ns
	 * @return array|false
	 */
	public function processTitleSelf( $text, $ns = null ) {
		return $this->processTitle( $text, $ns );
	}

	/**
	 * @throws MWException
	 */
	private function handlePageSelf() {
		// Handle page data.
		$this->debug( "Enter page handler." );
		$pageInfo = [ 'revisionCount' => 0, 'successfulRevisionCount' => 0 ];

		// Fields that can just be stuffed in the pageInfo object
		// $normalFields = [ 'title', 'ns', 'id', 'redirect', 'restrictions' ];

		$pageInfo['title'] = $this->title_text;

		$title = $this->processTitle( $pageInfo['title'], $pageInfo['ns'] ?? null );

		// $title is either an array of two titles or false.
		if ( is_array( $title ) ) {
			$this->pageCallback( $title );
			[ $pageInfo['_title'], $foreignTitle ] = $title;
		} else {
			// $badTitle = true;
			throw new MWException( "Bad title" );
		}

		if ( $title ) {
			$this->handleRevisionSelf( $pageInfo );
		}

		// @note $pageInfo is only set if a valid $title is processed above with
		//       no error. If we have a valid $title, then pageCallback is called
		//       above, $pageInfo['title'] is set and we do pageOutCallback here.
		//       If $pageInfo['_title'] is not set, then $foreignTitle is also not
		//       set since they both come from $title above.
		if ( array_key_exists( '_title', $pageInfo ) ) {
			/** @var Title $title */
			$title = $pageInfo['_title'];
			$this->pageOutCallback(
				$title,
				$foreignTitle,
				$pageInfo['revisionCount'],
				$pageInfo['successfulRevisionCount'],
				$pageInfo
			);
		}
	}

	/**
	 * @param array &$pageInfo
	 */
	private function handleRevisionSelf( &$pageInfo ) {
		$this->debug( "Enter revision handler" );
		$revisionInfo = [];

		// $normalFields = [ 'id', 'parentid', 'timestamp', 'comment', 'minor', 'origin',
		// 	'model', 'format', 'text', 'sha1' ];

		// $revisionInfo['contributor'] = $this->handleContributor();
		$revisionInfo = [
			'content' => $this->contents,
		];

		$pageInfo['revisionCount']++;
		if ( $this->processRevisionSelf( $pageInfo, $revisionInfo ) ) {
			$pageInfo['successfulRevisionCount']++;
		}
	}

	/**
	 * @param array $pageInfo
	 * @param array $revisionInfo
	 * @throws MWException
	 * @return mixed|false
	 */
	private function processRevisionSelf( $pageInfo, $revisionInfo ) {
		$revision = new WikiRevision( $this->config );

		$revId = $revisionInfo['id'] ?? 0;
		if ( $revId ) {
			$revision->setID( $revisionInfo['id'] );
		}

		$title = $pageInfo['_title'];
		$revision->setTitle( $title );

		// ***edited
		// $content = $this->makeContent( $title, $revId, $revisionInfo );
		// $revision->setContent( SlotRecord::MAIN, $content );

		foreach ( $revisionInfo['content'] ?? [] as $slotInfo ) {

			if ( !isset( $slotInfo['role'] ) ) {
				throw new MWException( "Missing role for imported slot." );
			}

			$content = $this->makeContent( $title, $revId, $slotInfo );
			$revision->setContent( $slotInfo['role'], $content );
		}

		$revision->setTimestamp( $revisionInfo['timestamp'] ?? wfTimestampNow() );

		if ( isset( $revisionInfo['comment'] ) ) {
			$revision->setComment( $revisionInfo['comment'] );
		}

		if ( isset( $revisionInfo['minor'] ) ) {
			$revision->setMinor( true );
		}
/*
		if ( isset( $revisionInfo['contributor']['ip'] ) ) {
			$revision->setUserIP( $revisionInfo['contributor']['ip'] );
		} elseif ( isset( $revisionInfo['contributor']['username'] ) ) {
			$revision->setUsername(
				$this->externalUserNames->applyPrefix( $revisionInfo['contributor']['username'] )
			);
		} else {
			$revision->setUsername( $this->externalUserNames->addPrefix( 'Unknown user' ) );
		}
*/
		if ( isset( $revisionInfo['sha1'] ) ) {
			$revision->setSha1Base36( $revisionInfo['sha1'] );
		}
		$revision->setNoUpdates( $this->mNoUpdates );

		return $this->revisionCallback( $revision );
	}

	//////////////////////// required methods ///////////////////

	// *** the following methods are public, but they set or they
	// *** rely on private properties, so they have to be cloned in this class

	/**
	 * @inheritDoc
	 */
	public function beforeImportPage( $titleAndForeignTitle ) {
		$title = $titleAndForeignTitle[0];
		$page = $this->wikiPageFactory->newFromTitle( $title );
		$this->countableCache['title_' . $title->getPrefixedText()] = $page->isCountable();
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function pageCallback( $title ) {
		if ( isset( $this->mPageCallback ) ) {
			call_user_func( $this->mPageCallback, $title );
		}
	}

	/**
	 * @inheritDoc
	 */
	public function setPageCallback( $callback ) {
		$previous = $this->mPageCallback;
		$this->mPageCallback = $callback;
		return $previous;
	}

	/**
	 * @inheritDoc
	 */
	public function setPageOutCallback( $callback ) {
		$previous = $this->mPageOutCallback;
		$this->mPageOutCallback = $callback;
		return $previous;
	}

	/**
	 * @inheritDoc
	 */
	public function setRevisionCallback( $callback ) {
		$previous = $this->mRevisionCallback;
		$this->mRevisionCallback = $callback;
		return $previous;
	}

	/**
	 * @inheritDoc
	 */
	public function setLogItemCallback( $callback ) {
		$previous = $this->mLogItemCallback;
		$this->mLogItemCallback = $callback;
		return $previous;
	}

	/**
	 * @inheritDoc
	 */
	public function setNoticeCallback( $callback ) {
		return wfSetVar( $this->mNoticeCallback, $callback );
	}

	/**
	 * @inheritDoc
	 */
	public function finishImportPage( PageIdentity $pageIdentity, $foreignTitle, $revCount,
		$sRevCount, $pageInfo
	) {
		// Update article count statistics (T42009)
		// The normal counting logic in WikiPage->doEditUpdates() is designed for
		// one-revision-at-a-time editing, not bulk imports. In this situation it
		// suffers from issues of replica DB lag. We let WikiPage handle the total page
		// and revision count, and we implement our own custom logic for the
		// article (content page) count.
		if ( !$this->disableStatisticsUpdate ) {
			$page = $this->wikiPageFactory->newFromTitle( $pageIdentity );

			$page->loadPageData( IDBAccessObject::READ_LATEST );
			$rev = $page->getRevisionRecord();
			if ( $rev === null ) {

				wfDebug( __METHOD__ . ': Skipping article count adjustment for ' . $pageIdentity .
					' because WikiPage::getRevisionRecord() returned null' );
			} else {
				$user = RequestContext::getMain()->getUser();
				$update = $page->newPageUpdater( $user )->prepareUpdate();
				$countKey = 'title_' . CacheKeyHelper::getKeyForPage( $pageIdentity );
				$countable = $update->isCountable();
				if ( array_key_exists( $countKey, $this->countableCache ) &&
					$countable != $this->countableCache[$countKey] ) {
					DeferredUpdates::addUpdate( SiteStatsUpdate::factory( [
						'articles' => ( (int)$countable - (int)$this->countableCache[$countKey] )
					] ) );
				}
			}
		}

		$title = Title::castFromPageIdentity( $pageIdentity );

		// ***
		$this->doDeferredUpdates( $title );

		return $this->hookRunner->onAfterImportPage( $title, $foreignTitle,
			$revCount, $sRevCount, $pageInfo );
	}

	//////////////////////// required private methods ///////////////////

	/**
	 * @inheritDoc
	 */
	private function revisionCallback( $revision ) {
		if ( isset( $this->mRevisionCallback ) ) {
			return call_user_func_array(
				$this->mRevisionCallback,
				[ $revision, $this ]
			);
		} else {
			return false;
		}
	}

	/**
	 * @inheritDoc
	 */
	private function processTitle( $text, $ns = null ) {
		if ( $this->foreignNamespaces === null ) {
			$foreignTitleFactory = new NaiveForeignTitleFactory(
				$this->contentLanguage
			);
		} else {
			$foreignTitleFactory = new NamespaceAwareForeignTitleFactory(
				$this->foreignNamespaces );
		}

		$foreignTitle = $foreignTitleFactory->createForeignTitle( $text,
			intval( $ns ) );

		$title = $this->importTitleFactory->createTitleFromForeignTitle(
			$foreignTitle );

		$commandLineMode = $this->config->get( 'CommandLineMode' );
		if ( $title === null ) {
			# Invalid page title? Ignore the page
			$this->notice( 'import-error-invalid', $foreignTitle->getFullText() );
			return false;
		} elseif ( $title->isExternal() ) {
			$this->notice( 'import-error-interwiki', $title->getPrefixedText() );
			return false;
		} elseif ( !$title->canExist() ) {
			$this->notice( 'import-error-special', $title->getPrefixedText() );
			return false;
		} elseif ( !$commandLineMode ) {
			$user = RequestContext::getMain()->getUser();

			if ( !$this->permissionManager->userCan( 'edit', $user, $title ) ) {
				# Do not import if the importing wiki user cannot edit this page
				$this->notice( 'import-error-edit', $title->getPrefixedText() );

				return false;
			}
		}

		return [ $title, $foreignTitle ];
	}

	/**
	 * @inheritDoc
	 */
	private function pageOutCallback( PageIdentity $pageIdentity, $foreignTitle, $revCount,
			$sucCount, $pageInfo ) {
		if ( isset( $this->mPageOutCallback ) ) {
			call_user_func_array( $this->mPageOutCallback, func_get_args() );
		}
	}

	/**
	 * @inheritDoc
	 */
	private function makeContent( Title $title, $revisionId, $contentInfo ) {
		$maxArticleSize = MediaWikiServices::getInstance()->getMainConfig()->get( 'MaxArticleSize' );

		// ***edited
		// main content can be null
		// if ( !isset( $contentInfo['text'] ) ) {
		// 	throw new MWException( 'Missing text field in import.' );
		// }

		// Make sure revisions won't violate $wgMaxArticleSize, which could lead to
		// database errors and instability. Testing for revisions with only listed
		// content models, as other content models might use serialization formats
		// which aren't checked against $wgMaxArticleSize.
		if ( ( !isset( $contentInfo['model'] ) ||
				in_array( $contentInfo['model'], [
					'wikitext',
					'css',
					'json',
					'javascript',
					'text',
					''
				] ) ) &&
			strlen( $contentInfo['text'] ) > $maxArticleSize * 1024
		) {
			throw new MWException( 'The text of ' .
				( $revisionId ?
					"the revision with ID $revisionId" :
					'a revision'
				) . " exceeds the maximum allowable size ({$maxArticleSize} KiB)" );
		}

		$role = $contentInfo['role'] ?? SlotRecord::MAIN;
		$model = $contentInfo['model'] ?? $this->getDefaultContentModel( $title, $role );
		$handler = $this->getContentHandler( $model );

		$text = $handler->importTransform( $contentInfo['text'] );

		return $handler->unserializeContent( $text );
	}

	/**
	 * @inheritDoc
	 */
	private function getDefaultContentModel( $title, $role ) {
		return $this->slotRoleRegistry
			->getRoleHandler( $role )
			->getDefaultModel( $title );
	}

	/**
	 * @inheritDoc
	 */
	private function getContentHandler( $model ) {
		return $this->contentHandlerFactory->getContentHandler( $model );
	}

}
