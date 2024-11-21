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

use ApiMain;
use CommentStoreComment;
use ContentHandler;
use ContentModelChange;
use DerivativeRequest;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;
use Parser;
use RawMessage;
use RequestContext;
use Status;
use Title;

class SubmitForm {

	/** @var Output */
	private $output;

	/** @var Context */
	private $context;

	/** @var User */
	private $user;

	/**
	 * @param User $user
	 * @param Context|null $context can be null
	 */
	public function __construct( $user, $context = null ) {
		$this->user = $user;
		// @ATTENTION ! use always Main context, in api
		// context OutputPage -> parseAsContent will work
		// in a different way !
		$this->context = $context ?? RequestContext::getMain();
		$this->output = $this->context->getOutput();
	}

	/**
	 * @param Output $output
	 */
	public function setOutput( $output ) {
		$this->output = $output;
	}

	/**
	 * @param array $flatten
	 * @param string $formula
	 * @param array &$properties
	 * @return string
	 */
	public function replacePageNameFormula( $flatten, $formula, &$properties ) {
		return preg_replace_callback( '/<\s*([^<>]+)\s*>/', static function ( $matches ) use ( $flatten, &$properties ) {
			$fullPath = $matches[1];
			// if ( $fullPath[0] !== '/' ) {
			// 	$fullPath = "/$fullPath";
			// }
			foreach ( $flatten as $path => $value_ ) {
				if ( $value_['pathNoIndex'] === $fullPath ) {
					$properties[] = $path;
					return $value_['value'];
				}
			}
		}, $formula );
	}

	/**
	 * @param string $path
	 * @param bool|string|null|array $value
	 * @param array $flatten
	 * @param string $formula
	 * @return string
	 */
	private	function replaceFormula( $path, $value, $flatten, $formula ) {
		// e.g. $path = Book/authors/0/first_name
		$parent = substr( (string)$path, 0, strrpos( (string)$path, '/' ) );

		return preg_replace_callback( '/<\s*([^<>]+)\s*>/', static function ( $matches ) use ( $parent, $value, $flatten ) {
			if ( $matches[1] === 'value' ) {
				return $value;
			}
			// @MUST MATCH resources/VisualDataLookupElement.js
			// @ATTENTION to match <first_name> at root level
			// that also exists at same level, the pattern
			// must be prefixed with '/'

			// first search reference in the same path

			$fullPath = $parent . '/' . $matches[1];
			if ( array_key_exists( $fullPath, $flatten ) ) {
				return $flatten[$fullPath]['value'];
			}

			$fullPath = $matches[1];
			if ( $fullPath[0] !== '/' ) {
				$fullPath = "/$fullPath";
			}

			if ( $value_['pathNoIndex'] === $fullPath ) {
				return $value;
			}
		}, $formula );
	}

	/**
	 * @param string|array $value
	 * @return string
	 */
	private	function parseWikitext( $value ) {
		// return $this->parser->recursiveTagParseFully( $str );
		if ( !is_array( $value ) ) {
			return Parser::stripOuterParagraph( $this->output->parseAsContent( $value ) );
		}
		$self = $this;
		return array_map( static function ( $v ) use ( $self ) {
			return Parser::stripOuterParagraph( $self->output->parseAsContent( $v ) );
		}, $value );
	}

	/**
	 * @param string $filename
	 * @param string $filekey
	 * @param array &$errors
	 */
	private	function publishStashedFile( $filename, $filekey, &$errors ) {
		$job = new PublishStashedFile( Title::makeTitle( NS_FILE, $filename ), [
			'filename' => $filename,
			'filekey' => $filekey,
			'comment' => '',
			// 'tags' => '',
			'text' => false,
			'watch' => false,
			// 'watchlistexpiry' => $watchlistExpiry,
			'session' => $this->context->exportSession()
		] );

		if ( !$job->run() ) {
			$errors[] = $this->context->msg( 'visualdata-special-submit-publishfilejoberror', $job->getLastError(), $filename )->parse();
		}
	}

	/**
	 * @param string $textFrom
	 * @param string $textTo
	 * @param array &$errors
	 * @return array|bool
	 */
	private function movePageApi( $textFrom, $textTo, &$errors ) {
		// Title::makeTitleSafe( NS_FILE, $textTo );
		$title_from = Title::newFromText( $textFrom );
		$title_to = Title::newFromText( $textTo );

		if ( !$title_from || !$title_from->isKnown() ) {
			return [ 'file does not exist' ];
		}

		if ( !$title_to ) {
			return [ 'invalid filename' ];
		}

		// $move_result = \VisualData::movePage( $user, $title_from, $title_to );
		// if ( !$move_result->isOK() ) {
		// }

		$req = new DerivativeRequest(
			$this->context->getRequest(),
			[
				'action' => 'move',
				'fromid' => $title_from->getArticleID(),
				'to' => $title_to->getFullText(),
				// 'reason' => $title_to->getText(),
				'token' => $this->user->getEditToken(),
			],
			true
		);

		try {
			$api = new ApiMain( $req, true );
			$api->execute();

		} catch ( \Exception $e ) {
			// $this->setLastError( get_class( $e ) . ": " . $e->getMessage() );
			$errors[] = $this->context->msg( 'visualdata-special-submit-move-error', $textFrom, $e->getMessage() )->parse();
			return false;
		}

		// @TODO
		// run thumbnail generation on the new path

		return $api->getResult()->getResultData();
	}

	/**
	 * @param Title $title
	 * @param array &$errors
	 * @return bool
	 */
	private function createEmptyRevision( $title, &$errors = [] ) {
		if ( !\VisualData::checkWritePermissions( $this->user, $title, $errors ) ) {
			$errors[] = $this->context->msg( 'visualdata-special-submit-permission-error' )->text();
			return false;
		}
		$wikiPage = \VisualData::getWikiPage( $title );
		$pageUpdater = $wikiPage->newPageUpdater( $this->user );
		$main_content = ContentHandler::makeContent( '', $title );
		$pageUpdater->setContent( SlotRecord::MAIN, $main_content );
		$comment = CommentStoreComment::newUnsavedComment( '' );
		$revisionRecord = $pageUpdater->saveRevision( $comment, EDIT_SUPPRESS_RC | EDIT_AUTOSUMMARY );
		$status = $pageUpdater->getStatus();
		return $status->isOK();
	}

	/**
	 * @see includes/specials/SpecialChangeContentModel.php
	 * @param WikiPage $page
	 * @param string $model
	 * @return Status
	 */
	public function changeContentModel( $page, $model ) {
		// $page = $this->wikiPageFactory->newFromTitle( $title );
		// ***edited
		$performer = ( method_exists( RequestContext::class, 'getAuthority' ) ? $this->context->getAuthority()
			: $this->user );
		// ***edited
		$services = MediaWikiServices::getInstance();
		$contentModelChangeFactory = $services->getContentModelChangeFactory();
		$changer = $contentModelChangeFactory->newContentModelChange(
			// ***edited
			$performer,
			$page,
			// ***edited
			$model
		);
		// MW 1.36+
		if ( method_exists( ContentModelChange::class, 'authorizeChange' ) ) {
			$permissionStatus = $changer->authorizeChange();
			if ( !$permissionStatus->isGood() ) {
				// *** edited
				$out = $this->output;
				$wikitext = $out->formatPermissionStatus( $permissionStatus );
				// Hack to get our wikitext parsed
				return Status::newFatal( new RawMessage( '$1', [ $wikitext ] ) );
			}
		} else {
			$errors = $changer->checkPermissions();
			if ( $errors ) {
				// *** edited
				$out = $this->output;
				$wikitext = $out->formatPermissionsErrorMessage( $errors );
				// Hack to get our wikitext parsed
				return Status::newFatal( new RawMessage( '$1', [ $wikitext ] ) );
			}
		}
		// Can also throw a ThrottledError, don't catch it
		$status = $changer->doContentModelChange(
			// ***edited
			$this->context,
			// $data['reason'],
			'',
			true
		);
		return $status;
	}

	/**
	 * @param \Title $targetTitle
	 * @param \WikiPage $wikiPage
	 * @param string $contentModel
	 * @param array &$errors
	 * @return bool
	 */
	private function updateContentModel( $targetTitle, $wikiPage, $contentModel, &$errors ) {
		if ( !$contentModel || $contentModel === $targetTitle->getContentModel() ) {
			return false;
		}
		$status = $this->changeContentModel( $wikiPage, $contentModel );
		if ( !$status->isOK() ) {
			$errors_ = $status->getErrorsByType( 'error' );
			foreach ( $errors_ as $error ) {
				$msg = array_merge( [ $error['message'] ], $error['params'] );
				// @see SpecialVisualData -> getMessage
				$errors[] = \Message::newFromSpecifier( $msg )->setContext( $this->context )->parse();
			}
		}
	}

	/**
	 * @param array $data
	 * @return array
	 */
	public function processData( $data ) {
		// this should happen only if hacked
		if ( !$this->user->isAllowed( 'visualdata-caneditdata' ) ) {
			echo $this->context->msg( 'visualdata-jsmodule-forms-cannot-edit-form' )->text();
			exit();
		}

		$errors = [];
		// @TODO implement update content-model

		// this function has to take care of:
		// * delete schemas from db and slot
		// * replacements of value-formula
		// * replacements of pagename-formula
		// * parsing value-formula as wikitext
		// * file upload
		// * file rename
		// * apply values-prefixes
		// * update content-model
		// * record properties
		// * redirect to return-page or display errors
		// @see for the order: https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/extensions/VisualData/+/refs/heads/1.2.4d/includes/specials/SpecialVisualDataSubmit.php

		$databaseManager = new DatabaseManager();

		$jsonData = [
			'schemas' => [],
			'schemas-data' => [],
			'categories' => []
		];
		$editTitle = null;
		if ( !empty( $data['options']['edit-page'] ) ) {
			$editTitle = Title::newFromText( $data['options']['edit-page'] );

			if ( $editTitle ) {
				$jsonData_ = \VisualData::getJsonData( $editTitle );

				if ( $jsonData_ !== false ) {
					$jsonData = array_merge( $jsonData, $jsonData_ );
				}
			}
		}

		// $targetSlot = isset( $data['form']['target-slot'] ) ? $data['form']['target-slot']
		// : \VisualData::getTargetSlot( $editTitle, $data['options']['target-slot'] );

		if ( !empty( $data['form']['target-slot'] ) ) {
			$targetSlot = $data['form']['target-slot'];

		// *** this should be always true
		} elseif ( !empty( $data['options']['target-slot'] ) ) {
			$targetSlot = $data['options']['target-slot'];

		} else {
			$targetSlot = \VisualData::getTargetSlot( $editTitle, 'jsondata' );
		}

		if ( array_key_exists( 'categories', $data['form'] ) ) {
			$jsonData['categories'] = $data['form']['categories'];
		} elseif ( empty( $data['options']['edit-categories'] )
			&& array_key_exists( 'default-categories', $data['options'] )
		) {
			$jsonData['categories'] = $data['options']['default-categories'];
		}

		// *** not used anymore
		if ( !empty( $data['options']['action'] ) && $data['options']['action'] === 'delete' ) {
			// @FIXME remove only deleted schemas
			// if context !== EditData
			if ( $data['config']['context'] === 'EditData' ) {
				unset( $jsonData['schemas'] );
				unset( $jsonData['schemas-data'] );
				$databaseManager->deletePage( $editTitle );
			} else {
				// $data['schemas'] contains the recorded schemas
				// or $jsonData['schemas'] = array_intersect_key( array_flip( $data['schemas'] ), $jsonData['schemas'] );
				foreach ( $data['schemas'] as $v ) {
					unset( $jsonData['schemas'][$v] );
					unset( $jsonData['schemas-data'][$v] );
				}
				$databaseManager->deleteArticleSchemas( $editTitle, $data['schemas'], $errors );
			}
			$slots = [
				$targetSlot => [
					'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
					'content' => $jsonData
				]
			];

			$ret = \VisualData::setJsonData( $this->user, $editTitle, $slots, $errors );

			// @TODO update database
			return [
				'errors' => [],
				'target-url' => $data['config']['context'] === 'EditData' ? $editTitle->getFullUrl()
					: $data['options']['origin-url']
			];
		}

		// user-defined title
		$userDefinedTitle = null;
		if (
			// !empty( $data['options']['action'] )
			// && $data['options']['action'] === 'create'
			!empty( $data['form']['target-title'] )
		) {
			$userDefinedTitle = Title::newFromText( $data['form']['target-title'] );
		}

		// first do replacements without parsing wikitext
		$transformedValues = [];

		// apply value formula
		$untransformedValues = [];
		foreach ( $data['flatten'] as $path => $value ) {
			if ( !empty( $value['schema']['wiki']['value-formula'] ) ) {
				if ( !is_array( $value['value'] ) ) {
					$data['flatten'][$path]['value'] = $transformedValues[$path] =
						$this->replaceFormula( $path, $value['value'], $data['flatten'], $value['schema']['wiki']['value-formula'] );
				} else {
					foreach ( $value['value'] as $v ) {
						$data['flatten'][$path]['value'][] = $transformedValues[$path][] =
							$this->replaceFormula( $path, $v, $data['flatten'], $value['schema']['wiki']['value-formula'] );
					}
				}
			}

			if ( !empty( $value['schema']['wiki']['value-prefix'] ) ) {
				if ( !is_array( $data['flatten'][$path]['value'] ) ) {
					$data['flatten'][$path]['value'] = $transformedValues[$path] =
						$value['schema']['wiki']['value-prefix'] . $data['flatten'][$path]['value'];
				} else {
					foreach ( $data['flatten'][$path]['value'] as $v ) {
						$data['flatten'][$path]['value'][] = $transformedValues[$path][] =
							$value['schema']['wiki']['value-prefix'] . $v;
					}
				}
			}

			if ( !empty( $value['schema']['wiki']['value-formula'] )
				|| !empty( $value['schema']['wiki']['value-prefix'] ) ) {
				$untransformedValues[$path] = $value['value'];
			}
		}

		// parse pagenameformula using transformed values
		$pagenameFormulaTitle = null;
		if ( empty( $userDefinedTitle ) && empty( $editTitle ) ) {

			// @ATTENTION, the following method allows
			// to parse wikitext only once when a value-formula
			// is used in a pagename formula
			// we assume that value-formulas used in
			// pagename formula can be parsed before the
			// targer title is set

			// first retrieve properties used in pagename formula
			$pagenameFormulaProperties = [];
			$this->replacePageNameFormula( $data['flatten'], $data['options']['pagename-formula'], $pagenameFormulaProperties );

			// parse wikitext
			// @FIXME or move inside replacePageNameFormula method
			// and run only once
			foreach ( $pagenameFormulaProperties as $path ) {
				$data['flatten'][$path]['parsedWikitext'] = true;
				$data['flatten'][$path]['value'] = $transformedValues[$path] =
					$this->parseWikitext( $data['flatten'][$path]['value'] );
			}

			$pagenameFormula = $this->parseWikitext(
				$this->replacePageNameFormula( $data['flatten'], $data['options']['pagename-formula'], $pagenameFormulaProperties )
			);

			$pagenameFormulaTitle = Title::newFromText( $pagenameFormula );
		}

		$targetTitle = null;
		if ( !empty( $userDefinedTitle ) ) {
			$targetTitle = $userDefinedTitle;
		} elseif ( !empty( $editTitle ) ) {
			$targetTitle = $editTitle;
		} elseif ( !empty( $pagenameFormulaTitle ) ) {
			$targetTitle = $pagenameFormulaTitle;
		} else {
			$errors[] = $this->context->msg( 'visualdata-special-submit-notitle' )->text();
		}

		// @FIXME once this will be managed by the api
		// errors can be returned immediately
		// if ( empty( $targetTitle ) ) {
		// 	return [
		// 		'errors' => $errors
		// 	];
		// }

		$isNewPage = false;

		if ( $targetTitle ) {
			// create target page, in order to
			// use a parser function like {{PAGEID}}
			if ( !$targetTitle->isKnown() ) {
				$isNewPage = true;
				// @TODO save freetext at this stage if
				// provided
				if ( !count( $errors ) ) {
					$this->createEmptyRevision( $targetTitle, $errors );
				}
			} elseif ( empty( $editTitle ) && empty( $data['options']['overwrite-existing-article-on-create'] ) ) {
				$errors[] = $this->context->msg( 'visualdata-special-submit-article-exists' )->text();
			}

			$this->context->setTitle( $targetTitle );
			$this->setOutput( $this->context->getOutput() );
		}

		// now parse wititext with the target title
		foreach ( $transformedValues as $path => $value ) {
			if ( !isset( $value['parsedWikitext'] ) ) {
				$data['flatten'][$path]['value'] = $transformedValues[$path] =
					$this->parseWikitext( $value );
			}
		}

		// save files
		foreach ( $data['flatten'] as $path => $value ) {
			if ( !empty( $value['filekey'] ) ) {
				$this->publishStashedFile( $value['value'], $value['filekey'], $errors );
			}
		}

		// merge transformedValues to json data
		$transformedValues = \VisualData::plainToNested( $transformedValues, true );

		// move files if needed
		$walkRec = function ( $arr1, $arr2, $path ) use( &$walkRec, $data, &$errors ) {
			foreach ( $arr2 as $key => $value ) {
				$path_ = $path ? "$path/$key" : $key;
				if ( is_array( $value ) ) {
					// if ( !isset( $arr1[$key] ) || !is_array( $arr1[$key] ) ) {
					// 	$arr1[$key] = [];
					// }
					$walkRec( $arr1[$key], $value, $path_ );
				}
				if ( array_key_exists( $path_, $data['flatten'] )
					&& array_key_exists( 'filekey', $data['flatten'][$path_] )
					// *** double-check here, we should distinguish
					// between replacing a file and renaming
					&& empty( $data['flatten'][$path_]['filekey'] )
					&& $arr1[$key] != $value
				) {
					// move file
					$res = $this->movePageApi( $arr1[$key], $value, $errors );
				}
				// $arr1[$key] = $value;
			}
			return $arr1;
		};

		if ( !empty( $jsonData['schemas'] ) ) {
			$walkRec( $jsonData['schemas'], $transformedValues, '' );
		}

		// save new values
		$schemas = array_replace_recursive( $data['data'], $transformedValues );

		$jsonData = array_merge( $jsonData, [ 'schemas' => $schemas ] );

		if ( !empty( $untransformedValues ) ) {
			$jsonData['schemas-data']['untransformed'] = $untransformedValues;
		}

		if ( array_key_exists( 'content-model', $data['form'] ) ) {
			$contentModel = $data['form']['content-model'];
		} elseif ( $editTitle ) {
			$contentModel = $editTitle->getContentModel();
		} elseif ( empty( $data['options']['edit-content-model'] )
			&& array_key_exists( 'default-content-model', $data['options'] ) ) {
			$contentModel = $data['options']['default-content-model'];
		} else {
			$contentModel = $data['config']['contentModel'];
		}

		$freetext = array_key_exists( 'freetext', $data['form'] ) ? $data['form']['freetext']
			: null;

		if ( $data['options']['action'] === 'create'
			&& !array_key_exists( 'freetext', $data['form'] )
			&& !empty( $data['options']['preload'] )
		) {
			$title_ = \VisualData::getTitleIfKnown( $data['options']['preload'] );
			if ( $title_ ) {
				$freetext = \VisualData::getWikipageContent( $title_ );
			}
		}

		if ( $targetTitle ) {
			// @FIXME once this will be managed by the api
			// this can be omitted
			$wikiPage = \VisualData::getWikiPage( $targetTitle );
			$this->updateContentModel( $targetTitle, $wikiPage, $contentModel, $errors );
		}

		// $errors is handled by reference
		if ( !count( $errors ) ) {

			if ( !empty( $editTitle ) ) {
				$deletedSchemas = array_diff( $data['recordedSchemas'], $data['schemas'] );
				if ( count( $deletedSchemas ) ) {
					$databaseManager->deleteArticleSchemas( $editTitle, $deletedSchemas, $errors );
				}
			}

			// @ATTENTION ! put this before setJsonData
			// otherwise it will be delayes after $wikiPage->doPurge();
			// below !!
			$databaseManager->recordProperties( $data['config']['context'], $targetTitle, $data['flatten'], $errors );

			$slots = [
				$targetSlot => [
					'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
					'content' => $jsonData
				]
			];

			// @ATTENTION !! if NULL the slot content
			// must not be edited
			if ( $targetSlot !== 'main' && $freetext !== null ) {
				$slots[SlotRecord::MAIN] = [
					'model' => $contentModel,
					'content' => $freetext
				];
			}

			$ret = \VisualData::setJsonData(
				$this->user,
				$targetTitle,
				$slots,
				$errors,
			);

			$databaseManager->invalidatePagesWithQueries( array_map( static function ( $v ) {
				return [ 'name' => $v ];
			}, $data['schemas'] ) );
		}

		if ( !count( $errors ) ) {
			MediaWikiServices::getInstance()->getHookContainer()->run( 'VisualData::OnFormSubmit', [
				$this->user,
				$targetTitle,
				$jsonData,
				$freetext,
				$isNewPage,
				&$errors
			] );
		}

		if ( count( $errors ) ) {
			return [
				'freetext' => $data['form']['freetext'] ?? '',
				'jsonData' => $jsonData,
				'categories' => $data['form']['categories'] ?? [],
				'errors' => array_unique( $errors ),
				'userDefined' => ( !array_key_exists( 'target-title', $data['form'] ) ? ''
					 : $data['form']['target-title'] ),

				// schemas currently active
				'schemas' => $data['schemas']
			];
		}

		// invalidate cache of edited page
		if ( $wikiPage ) {
			$wikiPage->doPurge();
		}

		return [
			'target-url' => !empty( $data['options']['return-url'] ) ? $data['options']['return-url']
				: $targetTitle->getFullUrl(),
			'errors' => [],
		];
	}

}
