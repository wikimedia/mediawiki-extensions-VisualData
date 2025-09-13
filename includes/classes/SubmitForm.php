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
 * @copyright Copyright ©2024-2025, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData;

use ApiMain;
use CommentStoreComment;
use ContentHandler;
use ContentModelChange;
use DerivativeRequest;
use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;
use Parser;
use RawMessage;
use RequestContext;
use Status;

class SubmitForm {

	/** @var Output */
	private $output;

	/** @var Context */
	private $context;

	/** @var User */
	private $user;

	/** @var MediaWikiServices */
	private $services;

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
		$this->services = MediaWikiServices::getInstance();
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
		// @FIXME match the properties actually defined in the schema
		// which could also contain angular brackets
		return preg_replace_callback( SchemaProcessor::MATCH_PROPERTY_PATTERN, static function ( $matches ) use ( $flatten, &$properties ) {
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
		$schemaName = strtok( (string)$path, '/' );

		// @FIXME match the properties actually defined in the schema
		// which could also contain angular brackets
		return preg_replace_callback( SchemaProcessor::MATCH_PROPERTY_PATTERN, static function ( $matches ) use ( $parent, $value, $flatten, $schemaName ) {
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

			// then at root level
			$fullPath = $schemaName . ( $matches[1][0] !== '/' ? '/' : '' ) . $matches[1];
			if ( array_key_exists( $fullPath, $flatten ) ) {
				return $flatten[$fullPath]['value'];
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
		$job = new PublishStashedFile( TitleClass::makeTitle( NS_FILE, $filename ), [
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
	 * @param UploadStash $stash
	 * @param string $destinationPath
	 * @param string $filekey
	 * @param array &$errors
	 * @return bool
	 */
	private function saveStashedFileToPath( $stash, $destinationPath, $filekey, &$errors ) {
		try {
			$file = $stash->getFile( $filekey );

			if ( !$file ) {
				$errors[] = 'Stashed file not found';
				return false;
			}

			$srcPath = $file->getLocalRefPath();

			$dir = dirname( $destinationPath );
			if ( !is_dir( $dir ) ) {
				mkdir( $dir, 0777, true );
			}

			return copy( $srcPath, $destinationPath );

		} catch ( \Exception $e ) {
			$errors[] = 'Failed to save stashed file: ' . $e->getMessage();
			return false;
		}
	}

	/**
	 * @param string $textFrom
	 * @param string $textTo
	 * @param array &$errors
	 * @return array|bool
	 */
	private function movePageApi( $textFrom, $textTo, &$errors ) {
		// TitleClass::makeTitleSafe( NS_FILE, $textTo );
		$title_from = TitleClass::newFromText( $textFrom );
		$title_to = TitleClass::newFromText( $textTo );

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
	 * @param Title|Mediawiki\Title\Title $title
	 * @param string $content
	 * @param string $contentModel
	 * @param array &$errors
	 * @return bool
	 */
	private function createInitialRevision( $title, $content, $contentModel, &$errors = [] ) {
		// "" will trigger an error by ContentHandler::makeContent
		if ( empty( $contentModel ) ) {
			$contentModel = null;
		}

		// @see https://github.com/wikimedia/mediawiki/blob/master/includes/page/WikiPage.php
		$flags = EDIT_SUPPRESS_RC | EDIT_AUTOSUMMARY | EDIT_INTERNAL;
		$summary = 'VisualData initial revision';

		$wikiPage = \VisualData::getWikiPage( $title );
		$pageUpdater = $wikiPage->newPageUpdater( $this->user );
		$main_content = ContentHandler::makeContent( (string)$content, $title, $contentModel );
		$pageUpdater->setContent( SlotRecord::MAIN, $main_content );
		$comment = CommentStoreComment::newUnsavedComment( $summary );
		$revisionRecord = $pageUpdater->saveRevision( $comment, $flags );
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
		$services = $this->services;
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
	 * @param Title|Mediawiki\Title\Title $targetTitle
	 * @param \WikiPage $wikiPage
	 * @param string $contentModel
	 * @param array &$errors
	 * @return bool
	 */
	private function updateContentModel( $targetTitle, $wikiPage, $contentModel, &$errors ) {
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
		$services = MediaWikiServices::getInstance();

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
		// * parsing value as wikitext
		// * file upload
		// * file rename
		// * apply values-prefixes
		// * set/update content-model
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
			$editTitle = TitleClass::newFromText( $data['options']['edit-page'] );

			if ( $editTitle ) {
				$jsonData_ = \VisualData::getJsonData( $editTitle );

				if ( $jsonData_ !== false ) {
					$jsonData = array_merge( $jsonData, $jsonData_ );
				}

				// delete removed schemas from recorded slot data
				foreach ( $data['initialSchemas'] as $v ) {
					if ( !in_array( $v, $data['schemas'] ) ) {
						unset( $jsonData['schemas'][$v] );
						unset( $jsonData['schemas-data'][$v] );
					}
				}
			}
		}

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

		// *** used from popup form
		if ( !empty( $data['options']['action'] ) && $data['options']['action'] === 'delete' ) {
			// *** not used anymore
			if ( $data['config']['context'] === 'EditData' ) {
				unset( $jsonData['schemas'] );
				unset( $jsonData['schemas-data'] );
				$databaseManager->deletePage( $editTitle );

			} else {
				// $data['schemas'] contains the handled schemas
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

			return [
				'errors' => [],
				'target-url' => $data['options']['origin-url']
			];
		}

		// user-defined title from mw.widgets.TitleInputWidget
		$userDefinedTitle = null;
		if (
			// !empty( $data['options']['action'] )
			// && $data['options']['action'] === 'create'
			!empty( $data['form']['target-title'] )
		) {
			$userDefinedTitle = TitleClass::newFromText( $data['form']['target-title'] );
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

			if ( !empty( $value['schema']['wiki']['filepath'] ) ) {
				if ( !is_array( $value['value'] ) ) {
					$data['flatten'][$path]['value'] = $transformedValues[$path] =
						$this->replaceFormula( $path, $value['value'], $data['flatten'], $value['schema']['wiki']['filepath'] );
				} else {
					foreach ( $value['value'] as $v ) {
						$data['flatten'][$path]['value'][] = $transformedValues[$path][] =
							$this->replaceFormula( $path, $v, $data['flatten'], $value['schema']['wiki']['filepath'] );
					}
				}
			}

			if ( !empty( $value['schema']['wiki']['value-formula'] )
				|| !empty( $value['schema']['wiki']['value-prefix'] )
				|| !empty( $value['schema']['wiki']['filepath'] )
			) {
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

			$pagenameFormulaTitle = \VisualData::parseTitleCounter( $pagenameFormula );
			// $pagenameFormulaTitle = TitleClass::newFromText( $pagenameFormula );
		}

		// replace possible field values inside the return url
		if ( !empty( $data['options']['return-url'] ) ) {
			$data['options']['return-url'] = $this->replacePageNameFormula( $data['flatten'],
				$data['options']['return-url'], $pagenameFormulaProperties );
		}

		// determine targetTitle
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

		// determine contentModel
		if ( array_key_exists( 'content-model', $data['form'] ) ) {
			$contentModel = $data['form']['content-model'];
		} elseif ( $editTitle ) {
			$contentModel = $editTitle->getContentModel();
		} elseif ( empty( $data['options']['edit-content-model'] )
			&& array_key_exists( 'default-content-model', $data['options'] )
		) {
			$contentModel = $data['options']['default-content-model'];
		} else {
			$contentModel = $data['config']['contentModel'];
		}

		// @ATTENTION, $contentModel can be an empty string

		// determine freetext
		$freetext = ( array_key_exists( 'freetext', $data['form'] ) ? $data['form']['freetext']
			: null );

		if ( $data['options']['action'] === 'create'
			&& !array_key_exists( 'freetext', $data['form'] )
			&& !empty( $data['options']['preload'] )
		) {
			$title_ = \VisualData::getTitleIfKnown( $data['options']['preload'] );
			if ( $title_ ) {
				$freetext = \VisualData::getWikipageContent( $title_ );
			}
		}

		$isNewPage = false;
		if ( $targetTitle ) {
			if ( !\VisualData::checkWritePermissions( $this->user, $targetTitle, $errors ) ) {
				$errors[] = $this->context->msg( 'visualdata-special-submit-permission-error' )->text();
			}

			if ( !$targetTitle->isKnown() ) {
				$isNewPage = true;
				if ( !count( $errors ) ) {
					// create target page, in order to
					// use a parser function like {{PAGEID}}
					// $this->createEmptyRevision( $targetTitle, $errors );
					// *** attention ! if the target slot for json-data
					// is main, this will be overwritten with the new content
					// and content-model, therefore $freetext could be set
					// always to an empty string in this case (it won't be
					// empty if the freetext was edited before assigning
					// json data and the main slot to them)
					$this->createInitialRevision( $targetTitle, $freetext, $contentModel, $errors );
				}

			} elseif ( empty( $editTitle )
				&& empty( $data['options']['overwrite-existing-article-on-create'] )
			) {
				$errors[] = $this->context->msg( 'visualdata-special-submit-article-exists', $targetTitle->getDBKey() )->parse();
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
		$stash = $this->services->getRepoGroup()->getLocalRepo()->getUploadStash();
		foreach ( $data['flatten'] as $path => $value ) {
			if ( !empty( $value['filekey'] ) ) {
				if ( empty( $value['schema']['wiki']['filepath'] ) ) {
					$this->publishStashedFile( $value['value'], $value['filekey'], $errors );
				} else {
					$this->saveStashedFileToPath( $stash, $value['value'], $value['filekey'], $errors );
				}
			}
		}

		// merge transformedValues to json data
		$transformedValues = \VisualData::plainToNested( $transformedValues, true );

		// move files if needed
		$walkRec = function ( $arrFrom, $arrTo, $path ) use( &$walkRec, $data, &$errors ) {
			foreach ( $arrTo as $key => $value ) {
				$path_ = ( $path ? "$path/$key" : $key );
				if ( is_array( $value ) ) {
					// *** $arrFrom[$key] should be always set
					if ( isset( $arrFrom[$key] ) && is_array( $arrFrom[$key] ) ) {
						$walkRec( $arrFrom[$key], $value, $path_ );
					}
				}
				if ( array_key_exists( $path_, $data['flatten'] )
					&& array_key_exists( 'filekey', $data['flatten'][$path_] )
					// *** if the filekey is empty the file has
					// been renamed, otherwise it has been replaced
					&& empty( $data['flatten'][$path_]['filekey'] )
					&& $arrFrom[$key] != $value
				) {
					// move file
					$res = $this->movePageApi( $arrFrom[$key], $value, $errors );
				}
			}
		};

		if ( !empty( $jsonData['schemas'] ) ) {
			$walkRec( $jsonData['schemas'], $transformedValues, '' );
		}

		// save new values
		$schemas = array_replace_recursive( $data['data'], $transformedValues );

		// count schemas that are present in json-data slot
		// but not in form schemas
		$preserveOtherSchemas = count( array_diff( array_keys( $jsonData['schemas'] ), $data['initialSchemas'] ) );

		if ( $preserveOtherSchemas ) {
			$schemas = array_merge( $jsonData['schemas'], $schemas );

			if ( array_key_exists( 'untransformed', $jsonData['schemas-data'] ) ) {
				foreach ( $jsonData['schemas-data']['untransformed'] as $k => $v ) {
					$schemaName_ = substr( (string)$k, 0, strrpos( (string)$k, '/' ) );
					$found_ = false;
					foreach ( $untransformedValues as $k_ => $v_ ) {
						if ( $schemaName_ === substr( (string)$k_, 0, strrpos( (string)$k_, '/' ) ) ) {
							$found_ = true;
							break;
						}
					}
					if ( !$found_ ) {
						$untransformedValues[$k] = $v;
					}
				}
			}
		}

		$jsonData = array_merge( $jsonData, [ 'schemas' => $schemas ] );

		// assign also if empty, to unset previous values if any
		$jsonData['schemas-data']['untransformed'] = $untransformedValues;

		$wikiPage = null;
		if ( $targetTitle && !$isNewPage ) {
			$wikiPage = \VisualData::getWikiPage( $targetTitle );
		}

		// $errors is handled by reference
		if ( !count( $errors ) ) {
			$targetUrl = ( !empty( $data['options']['return-url'] )
				? $data['options']['return-url']
				: $targetTitle->getLocalURL() );

			// @see Title -> getFullURL
			$fullUrl = (string)$services->getUrlUtils()->expand( $targetUrl, PROTO_FALLBACK );

			if ( filter_var( $fullUrl, FILTER_VALIDATE_URL ) === false ) {
				$errors[] = $this->context->msg( 'visualdata-special-submit-return-url-error', $targetUrl )->text();
			}
		}

		// update content model if necessary
		if ( $targetTitle
			&& !$isNewPage
			&& $contentModel
			&& $contentModel !== $targetTitle->getContentModel()
		) {
			$this->updateContentModel( $targetTitle, $wikiPage, $contentModel, $errors );
		}

		if ( !count( $errors ) ) {
			if ( !empty( $editTitle ) ) {
				$deletedSchemas = array_diff( $data['initialSchemas'], $data['schemas'] );
				if ( count( $deletedSchemas ) ) {
					$databaseManager->deleteArticleSchemas( $editTitle, $deletedSchemas, $errors );
				}
			}

			// @ATTENTION ! put this before setJsonData
			// otherwise it will be delayed after $wikiPage->doPurge();
			// below !!
			$databaseManager->recordProperties( $data['config']['context'], $targetTitle, $data['flatten'], $errors );

			// for new pages
			$slots = [
				$targetSlot => [
					'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
					'content' => $jsonData
				]
			];

			// @ATTENTION !! if freetext is NULL the slot content
			// must not be edited in order to keep it unchanged
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

			$services->getHookContainer()->run( 'VisualData::OnFormSubmit', [
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
			'target-url' => $targetUrl,
			'errors' => [],
		];
	}

}
