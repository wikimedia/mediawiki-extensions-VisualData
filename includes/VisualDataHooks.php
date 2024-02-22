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

use MediaWiki\Extension\VisualData\DatabaseManager as DatabaseManager;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\RevisionRecord;
use MediaWiki\Revision\SlotRecord;

define( 'SLOT_ROLE_VISUALDATA_JSONDATA', 'jsondata' );
define( 'CONTENT_MODEL_VISUALDATA_HTML', 'html' );
define( 'CONTENT_MODEL_VISUALDATA_JSONDATA', 'visualdata-jsondata' );

class VisualDataHooks {

	/**
	 * @param array $credits
	 * @return void
	 */
	public static function initExtension( $credits = [] ) {
		if ( !is_array( $GLOBALS['wgVisualDataEditDataNamespaces'] ) ) {
			$GLOBALS['wgVisualDataEditDataNamespaces'] = [ 0 ];
		}
	}

	/**
	 * @param MediaWikiServices $services
	 * @return void
	 */
	public static function onMediaWikiServices( $services ) {
		$services->addServiceManipulator( 'SlotRoleRegistry', static function ( \MediaWiki\Revision\SlotRoleRegistry $registry ) {
			if ( !$registry->isDefinedRole( SLOT_ROLE_VISUALDATA_JSONDATA ) ) {
				$registry->defineRoleWithModel( SLOT_ROLE_VISUALDATA_JSONDATA, CONTENT_MODEL_VISUALDATA_JSONDATA, [
					"display" => "none",
					"region" => "center",
					"placement" => "append"
				] );
			}
		} );
	}

	/**
	 * Register any render callbacks with the parser
	 *
	 * @param Parser $parser
	 */
	public static function onParserFirstCallInit( Parser $parser ) {
		$parser->setFunctionHook( 'visualdataprint', [ \VisualData::class, 'parserFunctionPrint' ] );
		$parser->setFunctionHook( 'visualdataquery', [ \VisualData::class, 'parserFunctionQuery' ] );
		$parser->setFunctionHook( 'visualdataform', [ \VisualData::class, 'parserFunctionForm' ] );
		$parser->setFunctionHook( 'visualdatabutton', [ \VisualData::class, 'parserFunctionButton' ] );
	}

	/**
	 * @param Title &$title
	 * @param null $unused
	 * @param OutputPage $output
	 * @param User $user
	 * @param WebRequest $request
	 * @param MediaWiki|MediaWiki\Actions\ActionEntryPoint $mediaWiki
	 * @return void
	 */
	public static function onBeforeInitialize( \Title &$title, $unused, \OutputPage $output, \User $user, \WebRequest $request, $mediaWiki ) {
		\VisualData::initialize();

		if ( empty( $GLOBALS['wgVisualDataDisableSlotsNavigation'] ) && isset( $_GET['slot'] ) ) {
			$slot = $_GET['slot'];
			$slots = \VisualData::getSlots( $title );

			if ( is_array( $slots ) && array_key_exists( $slot, $slots ) ) {
				// set content model of active slot
				$model = $slots[ $slot ]->getModel();
				$title->setContentModel( $model );
			}
		}
	}

	/**
	 * @param Content $content
	 * @param Title $title
	 * @param int $revId
	 * @param ParserOptions $options
	 * @param bool $generateHtml
	 * @param ParserOutput &$output
	 * @return void
	 */
	public static function onContentGetParserOutput( $content, $title, $revId, $options, $generateHtml, &$output ) {
		// this should be executed before onOutputPageParserOutput
		$databaseManager = new DatabaseManager();
		$databaseManager->removeLinks( $title );

		if ( empty( $GLOBALS['wgVisualDataDisableSlotsNavigation'] ) && isset( $_GET['slot'] ) ) {
			$slot = $_GET['slot'];
			$slots = \VisualData::getSlots( $title );

			if ( array_key_exists( $slot, $slots ) ) {
				$slot_content = $slots[ $slot ]->getContent();
				$contentHandler = $slot_content->getContentHandler();

				// @TODO: find a more reliable method
				if ( class_exists( 'MediaWiki\Content\Renderer\ContentParseParams' ) ) {
					// see includes/content/AbstractContent.php
					$cpoParams = new MediaWiki\Content\Renderer\ContentParseParams( $title, $revId, $options, $generateHtml );
					$contentHandler->fillParserOutputInternal( $slot_content, $cpoParams, $output );

				} else {
					// @TODO: find a more reliable method
					$output = MediaWikiServices::getInstance()->getParser()
						->parse( $slot_content->getText(), $title, $options, true, true, $revId );
				}
				// this will prevent includes/content/AbstractContent.php
				// fillParserOutput from running
				return false;
			}
		}
	}

	/**
	 * called before onPageSaveComplete
	 * @see https://gerrit.wikimedia.org/g/mediawiki/core/+/master/includes/Storage/PageUpdater.php
	 * @param WikiPage $wikiPage
	 * @param RevisionRecord $rev
	 * @param int $originalRevId
	 * @param User $user
	 * @param array &$tags
	 * @return void
	 */
	public static function onRevisionFromEditComplete( $wikiPage, $rev, $originalRevId, $user, &$tags ) {
		// *** this shouldn't be anymore necessary, since
		// we update the slots cache *while* the new slot contents are saved
		// and we delete the cache if the update fails
		// \VisualData::emptySlotsCache( $wikiPage->getTitle() );
	}

	/**
	 * @param WikiPage $page
	 * @param User $deleter
	 * @param string $reason
	 * @param int $pageID
	 * @param RevisionRecord $deletedRev
	 * @param ManualLogEntry $logEntry
	 * @param int $archivedRevisionCount
	 * @return void
	 */
	public static function onPageDeleteComplete( $page, $deleter, $reason, $pageID, $deletedRev, $logEntry, $archivedRevisionCount ) {
		$databaseManager = new DatabaseManager();
		$databaseManager->deletePage( $page->getTitle() );
	}

	/**
	 * @param Content $content
	 * @param Title $title
	 * @param ParserOutput &$parserOutput
	 * @return void
	 */
	public static function onContentAlterParserOutput( Content $content, Title $title, ParserOutput &$parserOutput ) {
		$jsonData = \VisualData::getJsonData( $title );

		$categories = [];
		if ( !empty( $jsonData['categories'] ) ) {
			foreach ( $jsonData['categories'] as $category ) {
				if ( !empty( $category ) ) {
					$categories[str_replace( ' ', '_', $category )] = ( version_compare( MW_VERSION, '1.38', '<' )
						? $parserOutput->getProperty( 'defaultsort' ) : null );
				}
			}
		}
		if ( version_compare( MW_VERSION, '1.38', '<' ) ) {
			$parserOutput->mCategories = $categories;
		} else {
			$parserOutput->setCategories( $categories );
		}
	}

	/**
	 * @param Parser $parser
	 * @param string &$text
	 */
	public static function onParserAfterTidy( Parser $parser, &$text ) {
		$title = $parser->getTitle();

		if ( !$title->isKnown() ) {
			return;
		}

		if ( isset( $GLOBALS['wgVisualDataJsonDataTrackingCategory'] ) ) {
			$jsonData = \VisualData::getJsonData( $title );
			if ( !empty( $jsonData ) ) {
				$parser->addTrackingCategory( 'visualdata-jsondata-tracking-category' );
			}
		}
	}

	/**
	 * @param DatabaseUpdater|null $updater
	 */
	public static function onLoadExtensionSchemaUpdates( DatabaseUpdater $updater = null ) {
		$base = __DIR__;
		$db = $updater->getDB();
		$dbType = $db->getType();

		$tables = DatabaseManager::$tables;

		// print_r($types);
		foreach ( $tables as $tableName ) {
			$filename = "$base/../$dbType/$tableName.sql";

			// echo $filename;
			if ( file_exists( $filename ) && !$db->tableExists( $tableName ) ) {
				$updater->addExtensionUpdate(
					[
						'addTable',
						$tableName,
						$filename,
						true
					]
				);
			}
		}

		$importer = \VisualData::getImporter();

		// @TODO MW 1.42
		if ( !$importer ) {
			return;
		}

		$error_messages = [];

		// https://www.mediawiki.org/wiki/Help:TemplateData
		$templates = [
			'VisualDataForm' => \VisualData::$FormDefaultParameters,

			// printouts and printouts template are dynamic
			// so we leave for now
			// 'VisualDataQuery' => \VisualData::$QueryDefaultParameters,
			'VisualDataButton' => \VisualData::$ButtonDefaultParameters,
			'VisualDataPrint' => \VisualData::$QueryDefaultParameters
		];

		foreach ( $templates as $pageName => $value ) {
			$text = \VisualData::createTemplateContent( $pageName, $value );

			$contents = [
				[
					'role' => SlotRecord::MAIN,
					'model' => 'wikitext',
					'text' => $text
				]
			];

			try {
				$importer->doImportSelf( "Template:$pageName", $contents );
			} catch ( Exception $e ) {
				$error_messages["Template:$pageName"] = $e->getMessage();
			}
		}
	}

	/**
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/MultiContentSave
	 * @param RenderedRevision $renderedRevision
	 * @param UserIdentity $user
	 * @param CommentStoreComment $summary
	 * @param int $flags
	 * @param Status $hookStatus
	 * @return void
	 */
	public static function onMultiContentSave( MediaWiki\Revision\RenderedRevision $renderedRevision, MediaWiki\User\UserIdentity $user, CommentStoreComment $summary, $flags, Status $hookStatus ) {
	}

	/**
	 * @param WikiPage $wikiPage
	 * @param MediaWiki\User\UserIdentity $user
	 * @param string $summary
	 * @param int $flags
	 * @param RevisionRecord $revisionRecord
	 * @param MediaWiki\Storage\EditResult $editResult
	 * @return void
	 */
	public static function onPageSaveComplete(
		WikiPage $wikiPage,
		MediaWiki\User\UserIdentity $user,
		string $summary,
		int $flags,
		RevisionRecord $revisionRecord,
		MediaWiki\Storage\EditResult $editResult
	) {
		$slots = $revisionRecord->getSlots()->getSlots();

		if ( array_key_exists( SLOT_ROLE_VISUALDATA_JSONDATA, $slots ) ) {
			// rebuild only if restoring a revision
			$revertMethod = $editResult->getRevertMethod();
			if ( $revertMethod === null ) {
				return;
			}
			$slot = $slots[SLOT_ROLE_VISUALDATA_JSONDATA];

		} else {
			// rebuild only if main slot contains json data
			$modelId = $revisionRecord->getSlot( SlotRecord::MAIN )->getContent()->getContentHandler()->getModelID();

			if ( $modelId !== 'json' && $modelId !== CONTENT_MODEL_VISUALDATA_JSONDATA ) {
				return;
			}

			$slot = $slots[SlotRecord::MAIN];
		}

		if ( $slot ) {
			$content = $slot->getContent();
			$title = $wikiPage->getTitle();
			$errors = [];
			\VisualData::rebuildArticleDataFromSlot( $title, $content, $errors );
		}
	}

	/**
	 * @param Title $title
	 * @param bool $create
	 * @param string $comment
	 * @param int $oldPageId
	 * @param array $restoredPages
	 * @return bool|void
	 */
	public static function onArticleUndelete( Title $title, $create, $comment, $oldPageId, $restoredPages ) {
		$revisionRecord = \VisualData::revisionRecordFromTitle( $title );
		$slots = $revisionRecord->getSlots()->getSlots();
		$errors = [];
		$slot = null;
		if ( array_key_exists( SLOT_ROLE_VISUALDATA_JSONDATA, $slots ) ) {
			$slot = $slots[SLOT_ROLE_VISUALDATA_JSONDATA];

		} else {
			// rebuild only if main slot contains json data
			$modelId = $revisionRecord->getSlot( SlotRecord::MAIN )->getContent()->getContentHandler()->getModelID();

			if ( $modelId === 'json' || $modelId === CONTENT_MODEL_VISUALDATA_JSONDATA ) {
				$slot = $slots[SlotRecord::MAIN];
			}
		}

		if ( $slot ) {
			$content = $slot->getContent();
			\VisualData::rebuildArticleDataFromSlot( $title, $content, $errors );
		}
	}

	/**
	 * @param string &$confstr
	 * @param User $user
	 * @param array &$forOptions
	 * @return void
	 */
	public static function onPageRenderingHash( &$confstr, User $user, &$forOptions ) {
		if ( empty( $GLOBALS['wgVisualDataDisableSlotsNavigation'] ) && isset( $_GET['slot'] ) ) {
			$confstr .= '!' . $_GET['slot'];
		}
	}

	/**
	 * @param OutputPage $out
	 * @param ParserOutput $parserOutput
	 * @return void
	 */
	public static function onOutputPageParserOutput( OutputPage $out, ParserOutput $parserOutput ) {
		$parserOutput->addWrapperDivClass( 'visualdata-content-model-' . $out->getTitle()->getContentModel() );

		$title = $out->getTitle();
		$user = $out->getUser();
		$databaseManager = new DatabaseManager();
		if ( $parserOutput->getExtensionData( 'visualdataquery' ) !== null ) {
			$queryParams = $parserOutput->getExtensionData( 'visualdataquerydata' );
			$databaseManager->storeLink( $title, 'query', $queryParams['schema'] );
		}

		if ( $parserOutput->getExtensionData( 'visualdataform' ) !== null ) {
			$pageForms = $parserOutput->getExtensionData( 'visualdataforms' );

			\VisualData::addJsConfigVars( $out, [
				'pageForms' => $pageForms,
				'config' => [
					'context' => 'parserfunction',
					// 'loadedData' => [],
				]
			] );

			$out->addModules( 'ext.VisualData.Forms' );
		}
	}

	/**
	 * @param Skin $skin
	 * @param array &$bar
	 * @return void
	 */
	public static function onSkinBuildSidebar( $skin, &$bar ) {
		if ( !empty( $GLOBALS['wgVisualDataDisableSidebarLink'] ) ) {
			return;
		}

		$specialpage_title = SpecialPage::getTitleFor( 'EditData' );
		$bar[ wfMessage( 'visualdata-sidepanel-section' )->text() ][] = [
			'text'   => wfMessage( 'visualdata-new-article' )->text(),
			'class'   => "visualdata-new-article",
			'href'   => $specialpage_title->getLocalURL()
		];

		$user = $skin->getUser();
		$title = $skin->getTitle();

		if ( $user->isAllowed( 'visualdata-canmanageschemas' ) ) {
			$specialpage_title = SpecialPage::getTitleFor( 'ManageSchemas' );
			$bar[ wfMessage( 'visualdata-sidepanel-section' )->text() ][] = [
				'text'   => wfMessage( 'visualdata-sidepanel-manageschemas' )->text(),
				'href'   => $specialpage_title->getLocalURL()
			];
		}

		// , 'forms', 'queries', 'schemas'
		$allowedItems = [ 'data' ];
		foreach ( $allowedItems as $item ) {
			$specialpage_title = SpecialPage::getTitleFor( 'VisualDataBrowse', ucfirst( $item ) );
			$bar[ wfMessage( 'visualdata-sidepanel-section' )->text() ][] = [
				'text'   => wfMessage( "visualdatabrowse-$item-label" )->text(),
				'href'   => $specialpage_title->getLocalURL()
			];
		}
	}

	/**
	 * @param Skin $skin
	 * @param array &$sidebar
	 * @return void
	 */
	public static function onSidebarBeforeOutput( $skin, &$sidebar ) {
	}

	/**
	 * @param SkinTemplate $skinTemplate
	 * @param array &$links
	 * @return void
	 */
	public static function onSkinTemplateNavigation( SkinTemplate $skinTemplate, array &$links ) {
		$user = $skinTemplate->getUser();
		$title = $skinTemplate->getTitle();

		if ( !$title->canExist() ) {
			return;
		}

		$errors = [];
		if ( \VisualData::checkWritePermissions( $user, $title, $errors )
			&& $user->isAllowed( 'visualdata-caneditdata' )
			&& !$title->isSpecialPage()
			&& in_array( $title->getNamespace(), $GLOBALS['wgVisualDataEditDataNamespaces'] )
		 ) {
			$link = [
				'class' => ( $skinTemplate->getRequest()->getVal( 'action' ) === 'editdata' ? 'selected' : '' ),
				'text' => wfMessage( 'visualdata-editdata-label' )->text(),
				'href' => $title->getLocalURL( 'action=editdata' )
			];

			$keys = array_keys( $links['views'] );
			$pos = array_search( 'edit', $keys );

			$links['views'] = array_intersect_key( $links['views'], array_flip( array_slice( $keys, 0, $pos + 1 ) ) )
				+ [ 'editdata' => $link ] + array_intersect_key( $links['views'], array_flip( array_slice( $keys, $pos + 1 ) ) );
		}

		if ( empty( $GLOBALS['wgVisualDataDisableSlotsNavigation'] ) ) {
			$slots = \VisualData::getSlots( $title );
			if ( $slots ) {
				$namespaces = $links['namespaces'];
				$links['namespaces'] = [];
				$selectedSlot = ( isset( $_GET['slot'] ) ? $_GET['slot'] : null );

				foreach ( $slots as $role => $slot ) {
					$selected = ( ( !$selectedSlot && $role === SlotRecord::MAIN ) || $role === $selectedSlot );

					$links['namespaces'][] = [
						'text' => ( $role === 'main' ? $namespaces[ array_key_first( $namespaces ) ]['text'] : wfMessage( 'visualdata-slot-label-' . $role )->text() ),
						'class' => ( $selected ? 'selected' : '' ),
						'context' => 'subject',
						'exists' => 1,
						'primary' => 1,
						// @see includes/skins/SkinTemplate.php -> buildContentNavigationUrls()
						'id' => 'ca-nstab-' . $role,
						'href' => ( $role !== SlotRecord::MAIN ? wfAppendQuery( $title->getLocalURL(), 'slot=' . $role ) : $title->getLocalURL() ),
					];
				}

				foreach ( $namespaces as $value ) {
					if ( $value['context'] !== 'subject' ) {
						$links['namespaces'][] = $value;
					}
				}
			}
		}
	}

	/**
	 * @todo replace the editor for alternate slots
	 * @param EditPage $editPage
	 * @param OutputPage $output
	 * @return void
	 */
	public static function onEditPageshowEditForminitial( EditPage $editPage, OutputPage $output ) {
	}

	/**
	 * @param OutputPage $outputPage
	 * @param Skin $skin
	 * @return void
	 */
	public static function onBeforePageDisplay( OutputPage $outputPage, Skin $skin ) {
		$title = $outputPage->getTitle();

		// @TODO use Ajax validation for page-forms
		if ( isset( $_SESSION ) && !empty( $_SESSION['visualdataform-submissiondata'] ) ) {
			$outputPage->addJsConfigVars( [
				'visualdata-submissiondata' => json_encode( $_SESSION['visualdataform-submissiondata'], true ),
			] );

			if ( empty( $_POST ) ) {
				unset( $_SESSION['visualdataform-submissiondata'] );
			}
		}
	}

}
