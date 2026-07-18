import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

import { ListsService } from '../services/lists.service';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import { UploadsService } from '../../../shared/services/uploads.service';
import { FavoritesStore } from '../../../shared/services/favorites.store';
import {
  ListItemDialogComponent,
  type ListItemDialogData,
  type ListItemDialogResult,
} from '../list-item-dialog/list-item-dialog.component';
import {
  ListSettingsComponent,
  type ListSettingsData,
} from '../list-settings/list-settings.component';
import {
  resolveGridConfig,
  resolveViewConfig,
  resolveCardStyle,
  findImageField,
  levelToCss,
  CARD_MATRIX_SLOTS,
  DEFAULT_FIELD_LAYOUT,
  TITLE_KEY,
  type GridConfig,
  type CardStyle,
  type CardShape,
  type TextPosition,
  type StyleLevel,
  type List,
  type ListField,
  type ListItem,
  type ViewConfig,
  type GridTemplate,
  type ListAction,
  type CardSlot,
  type FieldCardLayout,
  type DateDisplayFormat,
} from '../lists.types';
import {
  CardStyleDialogComponent,
  type CardStyleDialogData,
} from '../card-style-dialog/card-style-dialog.component';
import {
  MoveItemDialogComponent,
  type MoveItemDialogData,
  type MoveItemDialogResult,
} from '../move-item-dialog/move-item-dialog.component';
import {
  RouletteDialogComponent,
  type RouletteDialogData,
  type RouletteDialogResult,
} from '../roulette-dialog/roulette-dialog.component';

interface ItemGroup {
  key: string;
  label: string;
  items: ListItem[];
}

/** A row in the Fields popover: a real field, or the movable title entry. */
interface CardFieldRow {
  id: string;
  name: string;
  /** True for the synthetic title row (TITLE_KEY). */
  isTitle: boolean;
  /** The backing field, or null for the title row. */
  field: ListField | null;
  /** True when the row participates in the card text flow (reorderable with ↑ ↓). */
  inFlow: boolean;
}

@Component({
  selector: 'app-list-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, MatDialogModule, TagChipComponent, NgTemplateOutlet],
  template: `
    <div class="h-full flex flex-col">
      <header class="px-6 py-4 border-b border-border">
        <div class="flex items-center justify-between gap-4 mb-3">
          <div class="flex items-center gap-3">
            <a routerLink="/app/lists" class="text-text-muted hover:text-text text-sm">← Listas</a>
            <h1 class="text-2xl font-semibold flex items-center gap-2">
              @if (list()?.icon) {
                <span>{{ list()!.icon }}</span>
              }
              {{ list()?.name ?? '…' }}
            </h1>
          </div>
          <div class="flex items-center gap-2">
            @if (list(); as l) {
              <button
                type="button"
                (click)="toggleFavorite(l.id)"
                [title]="isFavorite(l.id) ? 'Remove from sidebar favorites' : 'Add to sidebar favorites'"
                [class]="
                  'w-10 h-10 grid place-items-center rounded-lg text-lg transition-colors ' +
                  (isFavorite(l.id) ? 'text-accent hover:bg-surface-hover' : 'text-text-muted hover:bg-surface-hover hover:text-text')
                "
              >{{ isFavorite(l.id) ? '★' : '☆' }}</button>
            }
            @if (enableRoulette()) {
              <button type="button" (click)="openRoulette()" class="px-3 py-2 rounded text-sm hover:bg-surface-hover" title="Pick a random item">
                🎲 Random
              </button>
            }
            <button type="button" (click)="openCardStyle()" class="px-3 py-2 rounded text-sm hover:bg-surface-hover" title="Card typography & style">
              🎨 Style
            </button>
            <button type="button" (click)="openSettings()" class="px-3 py-2 rounded text-sm hover:bg-surface-hover">
              ⚙ Settings
            </button>
            <button type="button" (click)="openCreateItem()" [disabled]="!list()"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              + New item
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <input
            type="search"
            [(ngModel)]="search"
            (ngModelChange)="reload()"
            placeholder="Search…"
            class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary w-64"
          />

          <select [ngModel]="effectiveTemplate()" (ngModelChange)="setTemplate($event)"
            class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary">
            <option value="card">Card</option>
            <option value="card-compact">Compact</option>
            <option value="dense-list">List</option>
            <option value="gallery-no-image">Gallery</option>
            <option value="table">Table</option>
          </select>

          @if (effectiveTemplate() === 'card') {
            <select [ngModel]="cardShape()" (ngModelChange)="setCardShape($event)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary" title="Card shape">
              <option value="cover">Shape: Cover</option>
              <option value="poster">Shape: Poster</option>
              <option value="square">Shape: Square</option>
              <option value="free">Shape: Free</option>
            </select>
            <select [ngModel]="textPosition()" (ngModelChange)="setTextPosition($event)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary" title="Text position">
              <option value="on">Text: On image</option>
              <option value="below">Text: Below</option>
              <option value="above">Text: Above</option>
            </select>
            <button type="button" (click)="toggleTextBg()"
              [class]="'px-3 py-2 rounded text-sm border ' + (textBg() ? 'border-primary text-primary bg-primary-ghost' : 'border-border text-text-muted hover:bg-surface-hover')"
              title="Text background panel">Text bg</button>
          }

          @if ((list()?.fields?.length ?? 0) > 0) {
            <div class="relative">
              <button type="button" (click)="fieldsPanelOpen.set(!fieldsPanelOpen())"
                class="px-3 py-2 bg-surface border border-border rounded text-sm hover:bg-surface-hover">
                ⚙ Fields
              </button>
              @if (fieldsPanelOpen()) {
                <div class="absolute z-30 mt-1 right-0 w-72 bg-surface border border-border rounded-lg shadow-lg p-2 max-h-[70vh] overflow-auto">
                  <p class="uppercase-tag px-2 pb-1">Card order — move with ↑ ↓ (title included)</p>
                  @for (row of fieldConfigRows(); track row.id) {
                    <div class="rounded hover:bg-surface-hover">
                      <div class="flex items-center gap-2 px-2 py-1.5 text-sm">
                        @if (row.isTitle) {
                          <span class="w-4 text-center text-[11px] font-bold text-primary" title="The item's title">T</span>
                          <span class="flex-1 truncate font-medium">{{ row.name }}</span>
                        } @else {
                          <input type="checkbox" [checked]="isFieldVisible(row.id)" (change)="toggleFieldVisible(row.id)" class="accent-primary" />
                          <span class="flex-1 truncate">{{ row.name }}</span>
                        }
                        @if (row.inFlow) {
                          <button type="button" (click)="moveFlowKey(row.id, -1)" class="w-6 h-6 grid place-items-center rounded hover:bg-background text-text-muted" title="Move up">↑</button>
                          <button type="button" (click)="moveFlowKey(row.id, 1)" class="w-6 h-6 grid place-items-center rounded hover:bg-background text-text-muted" title="Move down">↓</button>
                        }
                        @if (!row.isTitle && isFieldVisible(row.id)) {
                          <button type="button" (click)="toggleLayoutEditor(row.id)"
                            [class]="'w-6 h-6 grid place-items-center rounded text-xs ' + (layoutEditorFieldId() === row.id ? 'bg-primary/20 text-primary' : 'hover:bg-background text-text-muted')"
                            title="Field style">▦</button>
                        }
                      </div>
                      @if (!row.isTitle && row.field && layoutEditorFieldId() === row.id && isFieldVisible(row.id)) {
                        <div class="px-2 pb-2 pt-1.5 mt-0.5 border-t border-border">
                          <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                            <input type="checkbox" [checked]="layoutOf(row.id).showLabel" (change)="toggleFieldLabel(row.id)" class="accent-primary" />
                            Show "{{ row.name }}:" label
                          </label>
                          <select [ngModel]="levelOf(row.id)" (ngModelChange)="setFieldLevel(row.id, $event)"
                            class="w-full mt-1.5 px-2 py-1 bg-background border border-border rounded text-xs outline-none focus:border-primary"
                            title="Typographic level (edit fonts/sizes in 🎨 Style)">
                            <option value="title">Level: Title</option>
                            <option value="subtitle">Level: Subtitle</option>
                            <option value="body">Level: Body</option>
                            <option value="caption">Level: Caption</option>
                          </select>
                          @if (row.field?.fieldType === 'DATE') {
                            <select [ngModel]="layoutOf(row.id).dateFormat ?? 'full'" (ngModelChange)="setFieldDateFormat(row.id, $event)"
                              class="w-full mt-1.5 px-2 py-1 bg-background border border-border rounded text-xs outline-none focus:border-primary">
                              <option value="full">Date: full</option>
                              <option value="month">Date: month only (May)</option>
                              <option value="month-year">Date: month + year (May 2026)</option>
                              <option value="year">Date: year only (2026)</option>
                            </select>
                          }
                        </div>
                      }
                    </div>
                  }
                  <div class="flex items-center justify-between gap-2 px-2 pt-2 mt-1 border-t border-border">
                    <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                      <input type="checkbox" [checked]="gridConfig().showImage" (change)="patchGrid({ showImage: !gridConfig().showImage })" class="accent-primary" /> Image
                    </label>
                    <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                      <input type="checkbox" [checked]="gridConfig().showTags" (change)="patchGrid({ showTags: !gridConfig().showTags })" class="accent-primary" /> Tags
                    </label>
                    <button type="button" (click)="fieldsPanelOpen.set(false)" class="text-xs text-primary hover:underline">Done</button>
                  </div>
                </div>
              }
            </div>
          }

          @if ((list()?.fields?.length ?? 0) > 0) {
            <select [ngModel]="viewConfig().groupBy ?? ''" (ngModelChange)="setGroupBy($event || null)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary">
              <option value="">No grouping</option>
              @for (f of list()!.fields!; track f.id) {
                @if (f.fieldType === 'DATE') {
                  <option [value]="f.id + ':year'">Group by {{ f.name }} · Year</option>
                  <option [value]="f.id + ':month'">Group by {{ f.name }} · Month</option>
                } @else {
                  <option [value]="f.id">Group by {{ f.name }}</option>
                }
              }
            </select>

            <select [ngModel]="viewConfig().sortBy" (ngModelChange)="setSortBy($event)"
              class="px-3 py-2 bg-surface border border-border rounded text-sm outline-none focus:border-primary">
              <option value="createdAt">Sort: created</option>
              <option value="title">Sort: title</option>
              @for (f of list()!.fields!; track f.id) {
                <option [value]="f.id">Sort: {{ f.name }}</option>
              }
            </select>

            <button type="button" (click)="toggleSortDir()"
              class="px-3 py-2 bg-surface border border-border rounded text-sm hover:bg-surface-hover">
              {{ viewConfig().sortDir === 'asc' ? '↑ Asc' : '↓ Desc' }}
            </button>
          }

          <span class="text-xs text-text-muted ml-auto">{{ filteredItems().length }} items</span>
        </div>
      </header>

      <!-- Shared card text: a single ordered flow of fields + the title (movable). onImage adds cover styling. -->
      <ng-template #cardTextInner let-item let-onImage="onImage">
        @for (key of cardFlow(); track key) {
          @if (key === titleKey) {
            <h3 class="leading-tight truncate" [class]="onImage ? 'card-cover-title' : ''" [style]="titleStyle()">{{ item.title }}</h3>
          } @else {
            @if (fieldById(key); as f) {
              <div class="truncate leading-tight mt-0.5" [class]="onImage ? 'card-cover-meta' : ''" [style]="fieldStyle(key)">
                @if (layoutOf(key).showLabel) { <span class="opacity-70">{{ f.name }}: </span> }{{ formatFieldFor(f, item.customFields[f.id]) }}
              </div>
            }
          }
        }
        @if (gridConfig().showTags && item.tags?.length) {
          <div class="flex flex-wrap gap-1 mt-2">
            @for (t of item.tags!; track t.tagId) {
              @if (tagLookup(t.tagId); as tag) { <app-tag-chip [label]="tag.name" [color]="tag.color" /> }
            }
          </div>
        }
      </ng-template>

      <!-- Shared action buttons (set/move) — rendered on every card template. -->
      <ng-template #actionsRow let-item>
        @if (actions().length) {
          <div class="flex flex-wrap gap-1" (click)="$event.stopPropagation()">
            @for (a of actions(); track a.id) {
              <button type="button" (click)="runAction(item, a, $event)"
                class="text-xs px-2 py-1 rounded border border-border bg-surface hover:border-primary hover:bg-surface-hover transition-colors"
                [style.color]="a.color || null">
                {{ a.label }}
              </button>
            }
          </div>
        }
      </ng-template>

      <div class="flex-1 overflow-auto p-6">
        @if (loading()) {
          <p class="text-text-muted">Loading…</p>
        } @else if (filteredItems().length === 0) {
          <div class="text-center py-16 text-text-muted">
            <p class="mb-4">This list has no items yet.</p>
            <button type="button" (click)="openCreateItem()"
              class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:opacity-90">
              + Create the first item
            </button>
          </div>
        } @else {
          @for (group of groupedItems(); track group.key) {
            @if (group.label) {
              <h2 class="text-sm font-medium text-text-muted mb-3 mt-4 first:mt-0 border-b border-border pb-1">
                {{ group.label }} <span class="text-xs">({{ group.items.length }})</span>
              </h2>
            }

            @switch (effectiveTemplate()) {
              @case ('card') {
                <div [class]="cardGridClass()" [style.grid-template-columns]="cardGridCols()">
                  @for (item of group.items; track item.id) {
                    <div class="flex flex-col gap-1" [style.min-height.px]="cardMinHeight()">
                      @if (textPosition() === 'on') {
                        <!-- Text overlaid on the image -->
                        <button type="button" (click)="openEditItem(item)"
                          [class]="'card-cover text-left ' + shapeClass()"
                          [style.background-image]="resolveImage(item) ? 'url(' + resolveImage(item) + ')' : null"
                          [style.background-color]="resolveImage(item) ? null : (cardBg() || 'var(--color-surface-2)')"
                          [style.border-color]="cardBorder()">
                          @if (cardStyle().imageScrim) {
                            <div class="absolute inset-0 z-[1] pointer-events-none" [style.background]="'rgba(0,0,0,' + cardStyle().imageScrim / 100 + ')'"></div>
                          }
                          <div class="card-cover-content">
                            <div class="card-cover-top">
                              @if (gridConfig().showTags) {
                                @for (t of item.tags ?? []; track t.tagId) {
                                  @if (tagLookup(t.tagId); as tag) { <span class="card-cover-badge" [style.color]="tag.color">{{ tag.name }}</span> }
                                }
                              }
                            </div>
                            <div [class.card-text-panel]="textBg()">
                              <ng-container *ngTemplateOutlet="cardTextInner; context: { $implicit: item, onImage: true }"></ng-container>
                            </div>
                          </div>
                          @for (a of anchoredFields(); track a.id) {
                            @if (fieldById(a.id); as f) {
                              <span [class]="'card-anchor ' + a.cls" [style]="fieldStyle(a.id)">@if (layoutOf(a.id).showLabel) { <span class="opacity-70">{{ f.name }}: </span> }{{ formatFieldFor(f, item.customFields[f.id]) }}</span>
                            }
                          }
                        </button>
                      } @else {
                        <!-- Image as an element, text above or below it -->
                        <button type="button" (click)="openEditItem(item)"
                          class="w-full text-left cursor-pointer relative bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col"
                          [style.background]="cardBg()" [style.border-color]="cardBorder()">
                          @if (textPosition() === 'above') {
                            <div class="p-3"><ng-container *ngTemplateOutlet="cardTextInner; context: { $implicit: item, onImage: false }"></ng-container></div>
                          }
                          @if (gridConfig().showImage && resolveImage(item); as src) {
                            <div class="relative">
                              <img [src]="src" alt="" [class]="'w-full object-cover ' + shapeImgClass()" />
                              @if (cardStyle().imageScrim) {
                                <div class="absolute inset-0 pointer-events-none" [style.background]="'rgba(0,0,0,' + cardStyle().imageScrim / 100 + ')'"></div>
                              }
                            </div>
                          }
                          @if (textPosition() === 'below') {
                            <div class="p-3"><ng-container *ngTemplateOutlet="cardTextInner; context: { $implicit: item, onImage: false }"></ng-container></div>
                          }
                          @for (a of anchoredFields(); track a.id) {
                            @if (fieldById(a.id); as f) {
                              <span [class]="'card-anchor ' + a.cls" [style]="fieldStyle(a.id)">@if (layoutOf(a.id).showLabel) { <span class="opacity-70">{{ f.name }}: </span> }{{ formatFieldFor(f, item.customFields[f.id]) }}</span>
                            }
                          }
                        </button>
                      }
                      @if (actions().length) {
                        <ng-container *ngTemplateOutlet="actionsRow; context: { $implicit: item }"></ng-container>
                      }
                    </div>
                  }
                </div>
              }

              @case ('card-compact') {
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-6"
                  [style.grid-template-columns]="cardGridCols()">
                  @for (item of group.items; track item.id) {
                    <div class="bg-surface border border-border rounded overflow-hidden hover:border-primary transition-colors flex flex-col"
                      [style.min-height.px]="cardMinHeight()">
                      <button type="button" (click)="openEditItem(item)" class="text-left">
                        @if (gridConfig().showImage && resolveImage(item); as src) {
                          <img [src]="src" alt="" class="w-full aspect-square object-cover" />
                        }
                        <div class="p-2">
                          <h3 class="text-xs font-medium truncate">{{ item.title }}</h3>
                        </div>
                      </button>
                      @if (actions().length) {
                        <div class="px-2 pb-2 mt-auto">
                          <ng-container *ngTemplateOutlet="actionsRow; context: { $implicit: item }"></ng-container>
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              @case ('dense-list') {
                <ul class="space-y-1 mb-6">
                  @for (item of group.items; track item.id) {
                    <li class="flex items-center gap-2">
                      <button type="button" (click)="openEditItem(item)"
                        class="flex-1 min-w-0 text-left flex items-center gap-3 px-3 py-2 bg-surface border border-border rounded hover:border-primary transition-colors">
                        @if (gridConfig().showImage && resolveImage(item); as src) {
                          <img [src]="src" alt="" class="w-10 h-10 object-cover rounded shrink-0" />
                        }
                        <div class="flex-1 min-w-0">
                          <h3 class="font-medium truncate">{{ item.title }}</h3>
                          @for (fieldId of gridConfig().visibleFields; track fieldId) {
                            @if (fieldById(fieldId); as f) {
                              <span class="text-xs text-text-muted mr-2">
                                @if (layoutOf(fieldId).showLabel) { <strong>{{ f.name }}:</strong> }{{ formatFieldFor(f, item.customFields[f.id]) }}
                              </span>
                            }
                          }
                        </div>
                        @if (gridConfig().showTags) {
                          <div class="flex gap-1">
                            @for (t of item.tags ?? []; track t.tagId) {
                              @if (tagLookup(t.tagId); as tag) {
                                <app-tag-chip [label]="tag.name" [color]="tag.color" />
                              }
                            }
                          </div>
                        }
                      </button>
                      @if (actions().length) {
                        <ng-container *ngTemplateOutlet="actionsRow; context: { $implicit: item }"></ng-container>
                      }
                    </li>
                  }
                </ul>
              }

              @case ('gallery-no-image') {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6"
                  [style.grid-template-columns]="cardGridCols()">
                  @for (item of group.items; track item.id) {
                    <div class="bg-surface border border-border rounded-lg hover:border-primary transition-colors flex flex-col"
                      [style.min-height.px]="cardMinHeight()">
                    <button type="button" (click)="openEditItem(item)"
                      class="text-left p-4">
                      <h3 class="font-semibold mb-1">{{ item.title }}</h3>
                      @for (fieldId of gridConfig().visibleFields; track fieldId) {
                        @if (fieldById(fieldId); as f) {
                          <p class="text-sm text-text-muted">
                            @if (layoutOf(fieldId).showLabel) { <strong>{{ f.name }}:</strong> }{{ formatFieldFor(f, item.customFields[f.id]) }}
                          </p>
                        }
                      }
                      @if (gridConfig().showTags && item.tags?.length) {
                        <div class="flex flex-wrap gap-1 mt-2">
                          @for (t of item.tags!; track t.tagId) {
                            @if (tagLookup(t.tagId); as tag) {
                              <app-tag-chip [label]="tag.name" [color]="tag.color" />
                            }
                          }
                        </div>
                      }
                    </button>
                    @if (actions().length) {
                      <div class="px-4 pb-4">
                        <ng-container *ngTemplateOutlet="actionsRow; context: { $implicit: item }"></ng-container>
                      </div>
                    }
                    </div>
                  }
                </div>
              }

              @case ('table') {
                <div class="overflow-x-auto border border-border rounded mb-6">
                  <table class="w-full text-sm">
                    <thead class="bg-surface text-text-muted text-xs uppercase">
                      <tr>
                        <th class="px-3 py-2 text-left">Title</th>
                        @for (f of list()?.fields ?? []; track f.id) {
                          <th class="px-3 py-2 text-left">{{ f.name }}</th>
                        }
                        @if (gridConfig().showTags) {
                          <th class="px-3 py-2 text-left">Tags</th>
                        }
                        @if (actions().length) {
                          <th class="px-3 py-2 text-left">Actions</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of group.items; track item.id) {
                        <tr (click)="openEditItem(item)"
                          class="border-t border-border hover:bg-surface-hover cursor-pointer">
                          <td class="px-3 py-2 font-medium">{{ item.title }}</td>
                          @for (f of list()?.fields ?? []; track f.id) {
                            <td class="px-3 py-2 text-text-muted">
                              @if (f.fieldType === 'IMAGE_URL' && item.customFields[f.id]) {
                                <img [src]="resolveImageUrl(item.customFields[f.id])" alt="" class="w-10 h-10 object-cover rounded" />
                              } @else {
                                {{ formatField(item.customFields[f.id]) }}
                              }
                            </td>
                          }
                          @if (gridConfig().showTags) {
                            <td class="px-3 py-2">
                              <div class="flex flex-wrap gap-1">
                                @for (t of item.tags ?? []; track t.tagId) {
                                  @if (tagLookup(t.tagId); as tag) {
                                    <app-tag-chip [label]="tag.name" [color]="tag.color" />
                                  }
                                }
                              </div>
                            </td>
                          }
                          @if (actions().length) {
                            <td class="px-3 py-2">
                              <ng-container *ngTemplateOutlet="actionsRow; context: { $implicit: item }"></ng-container>
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* Fields anchored to the 3×3 matrix on the Large card */
    .card-anchor {
      position: absolute;
      z-index: 10;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1;
      color: var(--color-text-muted);
      background: color-mix(in srgb, var(--color-surface) 85%, transparent);
      padding: 2px 6px;
      border-radius: 6px;
      pointer-events: none;
      max-width: 72%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class ListDetailComponent implements OnInit {
  private readonly service = inject(ListsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly uploads = inject(UploadsService);
  private readonly favoritesStore = inject(FavoritesStore);

  protected isFavorite(listId: string): boolean {
    return this.favoritesStore.isFavorite('LIST', listId);
  }

  protected toggleFavorite(listId: string): void {
    this.favoritesStore.toggle('LIST', listId);
  }

  @Input({ required: true }) id!: string;

  protected readonly loading = signal(true);
  protected readonly list = signal<List | null>(null);
  protected readonly rawItems = signal<ListItem[]>([]);
  protected readonly fieldsPanelOpen = signal(false);
  /** Which field's per-card style editor is expanded, if any. */
  protected readonly layoutEditorFieldId = signal<string | null>(null);
  protected readonly titleKey = TITLE_KEY;
  protected search = '';

  /**
   * Rows for the Fields popover: the card flow (visible fields + the movable
   * title, reorderable) first, then anchored-but-visible fields, then hidden
   * fields (togglable). Mirrors the on-card render order so ↑/↓ match reality.
   */
  protected readonly fieldConfigRows = computed<CardFieldRow[]>(() => {
    const fields = this.list()?.fields ?? [];
    const byId = new Map(fields.map((f) => [f.id, f]));
    const flow = this.cardFlow();
    const flowSet = new Set(flow);
    const vf = this.gridConfig().visibleFields;

    const flowRows: CardFieldRow[] = flow
      .map((id): CardFieldRow =>
        id === TITLE_KEY
          ? { id, name: 'Title', isTitle: true, field: null, inFlow: true }
          : { id, name: byId.get(id)?.name ?? '', isTitle: false, field: byId.get(id) ?? null, inFlow: true },
      )
      .filter((r) => r.isTitle || r.field);

    // Legacy anchored fields (absolutely positioned) — visible but not in the flow.
    const anchoredRows: CardFieldRow[] = vf
      .filter((id) => id !== TITLE_KEY && !flowSet.has(id) && byId.has(id))
      .map((id) => ({ id, name: byId.get(id)!.name, isTitle: false, field: byId.get(id)!, inFlow: false }));

    const hiddenRows: CardFieldRow[] = fields
      .filter((f) => !vf.includes(f.id))
      .map((f) => ({ id: f.id, name: f.name, isTitle: false, field: f, inFlow: false }));

    return [...flowRows, ...anchoredRows, ...hiddenRows];
  });

  /**
   * Ordered keys rendered in the card text, top→bottom (fields + the title).
   * If `visibleFields` contains TITLE_KEY the stored order wins; otherwise
   * (legacy lists) the title sits between the "above title" and "below title"
   * fields, reproducing the pre-movable-title appearance.
   */
  protected readonly cardFlow = computed<string[]>(() => {
    const vf = this.gridConfig().visibleFields ?? [];
    const anchored = new Set<CardSlot>(CARD_MATRIX_SLOTS);
    const flow = vf.filter((id) => id === TITLE_KEY || !anchored.has(this.layoutOf(id).slot));
    if (vf.includes(TITLE_KEY)) return flow;
    const stack = flow.filter((id) => this.layoutOf(id).slot === 'stack').reverse();
    const body = flow.filter((id) => this.layoutOf(id).slot !== 'stack');
    return [...stack, TITLE_KEY, ...body];
  });

  protected readonly actions = computed<ListAction[]>(() => this.viewConfig().actions ?? []);
  protected readonly enableRoulette = computed(() => this.viewConfig().enableRoulette === true);

  /** Spin a roulette over the currently-visible items and open the winner. */
  protected openRoulette(): void {
    const items = this.filteredItems();
    if (items.length === 0) {
      this.toastr.info('No items to pick from');
      return;
    }
    const entries = items.map((it) => ({
      id: it.id,
      title: it.title,
      image: this.resolveImage(it),
    }));
    this.dialog
      .open<RouletteDialogComponent, RouletteDialogData, RouletteDialogResult>(RouletteDialogComponent, {
        data: { entries },
        width: 'min(420px, 95vw)',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((id) => {
        if (!id) return;
        const item = this.rawItems().find((it) => it.id === id);
        if (item) this.openEditItem(item);
      });
  }

  /** Runs a card action: a 'set' updates a field; a 'move' relocates the item. */
  protected runAction(item: ListItem, action: ListAction, event: Event): void {
    event.stopPropagation();
    if (action.kind === 'move') {
      this.runMoveAction(item, action);
      return;
    }
    if (!action.fieldId) return;
    const fieldId = action.fieldId;
    const customFields = { ...item.customFields, [fieldId]: action.value };
    this.service.updateItem(this.id, item.id, { customFields }).subscribe({
      next: () => {
        this.rawItems.update((arr) =>
          arr.map((it) => (it.id === item.id ? { ...it, customFields } : it)),
        );
        this.toastr.success(`${item.title} → ${action.value}`);
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  /** Opens the move dialog (loading the target list's fields), then moves the item. */
  private runMoveAction(item: ListItem, action: ListAction): void {
    const sourceList = this.list();
    if (!sourceList || !action.targetListId) return;
    this.service.findById(action.targetListId).subscribe({
      next: (targetList) => {
        this.dialog
          .open<MoveItemDialogComponent, MoveItemDialogData, MoveItemDialogResult>(
            MoveItemDialogComponent,
            {
              data: { sourceList, item, targetList },
              width: 'min(560px, 95vw)',
              maxWidth: '95vw',
            },
          )
          .afterClosed()
          .subscribe((result) => {
            if (!result) return;
            this.service
              .moveItem(this.id, item.id, {
                targetListId: action.targetListId!,
                customFieldsPatch: result.customFieldsPatch,
              })
              .subscribe({
                next: () => {
                  this.rawItems.update((arr) => arr.filter((it) => it.id !== item.id));
                  this.toastr.success(`${item.title} → ${targetList.name}`);
                },
                error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
              });
          });
      },
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected isFieldVisible(fieldId: string): boolean {
    return this.gridConfig().visibleFields.includes(fieldId);
  }

  protected toggleFieldVisible(fieldId: string): void {
    const visible = this.gridConfig().visibleFields;
    const next = visible.includes(fieldId)
      ? visible.filter((id) => id !== fieldId)
      : [...visible, fieldId];
    this.patchGridConfig({ visibleFields: next });
  }

  /**
   * Reorder a card-flow key (a field or the title) by one step. Persists the
   * flow — including TITLE_KEY — into `visibleFields`, materializing the legacy
   * order the first time so the title becomes an explicit, movable entry.
   */
  protected moveFlowKey(key: string, delta: number): void {
    const flow = [...this.cardFlow()];
    const i = flow.indexOf(key);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= flow.length) return;
    [flow[i], flow[j]] = [flow[j], flow[i]];
    // Anchored (absolutely-positioned) visible fields aren't in the flow — keep them.
    const flowSet = new Set(this.cardFlow());
    const anchoredIds = this.gridConfig().visibleFields.filter((id) => !flowSet.has(id));
    this.patchGridConfig({ visibleFields: [...flow, ...anchoredIds] });
  }

  protected patchGrid(patch: Partial<GridConfig>): void {
    this.patchGridConfig(patch);
  }

  // ─── Per-field card layout (Large card designer) ─────────
  protected layoutOf(fieldId: string): FieldCardLayout {
    return this.gridConfig().cardLayout?.[fieldId] ?? DEFAULT_FIELD_LAYOUT;
  }

  protected toggleLayoutEditor(fieldId: string): void {
    this.layoutEditorFieldId.update((cur) => (cur === fieldId ? null : fieldId));
  }

  protected toggleFieldLabel(fieldId: string): void {
    this.patchFieldLayout(fieldId, { showLabel: !this.layoutOf(fieldId).showLabel });
  }

  protected setFieldDateFormat(fieldId: string, fmt: DateDisplayFormat): void {
    this.patchFieldLayout(fieldId, { dateFormat: fmt });
  }

  protected setFieldLevel(fieldId: string, level: StyleLevel): void {
    this.patchFieldLayout(fieldId, { level });
  }

  private patchFieldLayout(fieldId: string, patch: Partial<FieldCardLayout>): void {
    const current = this.gridConfig().cardLayout ?? {};
    const next: Record<string, FieldCardLayout> = {
      ...current,
      [fieldId]: { ...this.layoutOf(fieldId), ...patch },
    };
    this.patchGridConfig({ cardLayout: next });
  }

  // ─── Card typography levels + chrome ─────────────────────
  protected readonly cardStyle = computed<CardStyle>(() => resolveCardStyle(this.gridConfig()));
  protected readonly cardBg = computed<string | null>(() => this.cardStyle().background || null);
  protected readonly cardBorder = computed<string | null>(() => this.cardStyle().border || null);
  /** Custom card width overrides the responsive grid columns (0 = default). */
  protected readonly cardGridCols = computed<string | null>(() => {
    const w = this.cardStyle().cardWidth;
    return w > 0 ? `repeat(auto-fill, minmax(${w}px, 1fr))` : null;
  });
  protected readonly cardMinHeight = computed<number | null>(() => this.cardStyle().cardHeight || null);

  /** View discriminator for the @switch — all card templates fold into 'card'. */
  protected readonly effectiveTemplate = computed<GridTemplate>(() => {
    const t = this.gridConfig().template;
    if (t === 'card-large' || t === 'card-cover' || t === 'poster' || t === 'square' || t === 'card') {
      return 'card' as GridTemplate;
    }
    return t;
  });

  /** Card shape, derived from the explicit setting or the legacy template. */
  protected readonly cardShape = computed<CardShape>(() => {
    const g = this.gridConfig();
    if (g.cardShape) return g.cardShape;
    switch (g.template) {
      case 'card-cover':
        return 'cover';
      case 'poster':
        return 'poster';
      case 'square':
        return 'square';
      default:
        return 'free';
    }
  });

  protected readonly textPosition = computed<TextPosition>(() => {
    const g = this.gridConfig();
    if (g.textPosition) return g.textPosition;
    return g.template === 'card-large' ? 'below' : 'on';
  });

  protected readonly textBg = computed<boolean>(() => {
    const g = this.gridConfig();
    return g.textBackground !== undefined ? g.textBackground : this.textPosition() !== 'on';
  });

  /** Aspect class for the on-image cover box (free falls back to cover's 7:4). */
  protected readonly shapeClass = computed<string>(() => {
    const s = this.cardShape();
    return s === 'poster' ? 'poster' : s === 'square' ? 'square' : '';
  });

  /** Aspect class for the <img> element when text is below/above. */
  protected readonly shapeImgClass = computed<string>(() => {
    switch (this.cardShape()) {
      case 'poster':
        return 'aspect-[2/3]';
      case 'square':
        return 'aspect-square';
      case 'cover':
        return 'aspect-[7/4]';
      default:
        return 'h-40';
    }
  });

  protected readonly cardGridClass = computed<string>(() => {
    const s = this.cardShape();
    return s === 'poster' || s === 'square'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6';
  });

  /** The level a field renders as: explicit, else a sensible default per slot. */
  protected levelOf(fieldId: string): StyleLevel {
    const layout = this.layoutOf(fieldId);
    if (layout.level) return layout.level;
    if (layout.slot === 'stack') return 'subtitle';
    if (layout.slot === 'body') return 'body';
    return 'caption';
  }

  protected fieldStyle(fieldId: string): { [k: string]: string } {
    return levelToCss(this.cardStyle().levels[this.levelOf(fieldId)]);
  }

  protected titleStyle(): { [k: string]: string } {
    return levelToCss(this.cardStyle().levels.title);
  }

  protected readonly anchoredFields = computed<{ id: string; cls: string }[]>(() => {
    const matrix = new Set<CardSlot>(CARD_MATRIX_SLOTS);
    return this.gridConfig()
      .visibleFields.filter((id) => matrix.has(this.layoutOf(id).slot))
      .map((id) => ({ id, cls: this.anchorClass(this.layoutOf(id).slot) }));
  });

  private anchorClass(slot: CardSlot): string {
    switch (slot) {
      case 'tl': return 'top-2 left-2';
      case 'tc': return 'top-2 left-1/2 -translate-x-1/2';
      case 'tr': return 'top-2 right-2';
      case 'ml': return 'top-1/2 left-2 -translate-y-1/2';
      case 'mc': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'mr': return 'top-1/2 right-2 -translate-y-1/2';
      case 'bl': return 'bottom-2 left-2';
      case 'bc': return 'bottom-2 left-1/2 -translate-x-1/2';
      case 'br': return 'bottom-2 right-2';
      default: return '';
    }
  }

  protected formatFieldFor(field: ListField, value: unknown): string {
    const layout = this.layoutOf(field.id);
    if (
      field.fieldType === 'DATE' &&
      layout.dateFormat &&
      layout.dateFormat !== 'full' &&
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      const d = new Date(String(value));
      if (!isNaN(d.getTime())) {
        // UTC: a date-only value like "2020-01-01" is UTC midnight; reading it in
        // a negative-offset timezone would otherwise show the previous day/year.
        if (layout.dateFormat === 'year') return String(d.getUTCFullYear());
        if (layout.dateFormat === 'month') {
          return d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        }
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
      }
    }
    return this.formatField(value);
  }

  protected readonly gridConfig = computed<GridConfig>(() => {
    const l = this.list();
    return l ? resolveGridConfig(l) : {
      template: 'card-large', visibleFields: [], showImage: true, imagePosition: 'top', showTags: true,
    };
  });

  protected readonly viewConfig = computed<ViewConfig>(() => {
    const l = this.list();
    return l ? resolveViewConfig(l) : {
      groupBy: null, sortBy: 'createdAt', sortDir: 'desc', filters: [],
    };
  });

  protected readonly imageField = computed<ListField | null>(() => {
    const l = this.list();
    return l ? findImageField(l) : null;
  });

  protected readonly tagMap = computed(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const t of this.list()?.tags ?? []) map.set(t.id, { name: t.name, color: t.color });
    return map;
  });

  protected readonly fieldMap = computed(() => {
    const map = new Map<string, ListField>();
    for (const f of this.list()?.fields ?? []) map.set(f.id, f);
    return map;
  });

  protected readonly filteredItems = computed<ListItem[]>(() => {
    const q = this.search.trim().toLowerCase();
    return this.rawItems().filter((item) => {
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  protected readonly groupedItems = computed<ItemGroup[]>(() => {
    const config = this.viewConfig();
    const items = this.applySort(this.filteredItems(), config);

    if (!config.groupBy) {
      return [{ key: '__all__', label: '', items }];
    }

    // groupBy is either a fieldId, or "fieldId:year" / "fieldId:month" for dates.
    const [fieldId, granularity] = config.groupBy.split(':') as [string, 'year' | 'month' | undefined];

    const groups = new Map<string, ListItem[]>();
    const labels = new Map<string, string>();
    for (const item of items) {
      const raw = item.customFields[fieldId];
      const { key, label } = this.groupKey(raw, granularity);
      labels.set(key, label);
      const arr = groups.get(key) ?? [];
      arr.push(item);
      groups.set(key, arr);
    }

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return nb - na;
      return b.localeCompare(a);
    });

    return sortedKeys.map((k) => ({
      key: k,
      label: k === '__none__' ? 'Unclassified' : labels.get(k) ?? k,
      items: groups.get(k)!,
    }));
  });

  /**
   * Computes the group key + display label for a value. For date fields with a
   * year/month granularity, the key is sortable ("2026" / "2026-05") while the
   * label is human ("2026" / "May 2026") — so the per-day uniqueness problem
   * (one item per date) collapses into useful year/month buckets.
   */
  private groupKey(
    raw: unknown,
    granularity: 'year' | 'month' | undefined,
  ): { key: string; label: string } {
    if (raw === null || raw === undefined || raw === '') {
      return { key: '__none__', label: 'Unclassified' };
    }
    if (granularity) {
      const d = new Date(String(raw));
      if (!isNaN(d.getTime())) {
        // UTC throughout: "2020-01-01" is stored as UTC midnight, so a negative
        // local offset would bucket Jan 1 into the previous year. (Bugfix)
        const year = d.getUTCFullYear();
        if (granularity === 'year') return { key: String(year), label: String(year) };
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        return { key: `${year}-${month}`, label };
      }
    }
    return { key: String(raw), label: String(raw) };
  }

  ngOnInit(): void {
    this.loadList();
  }

  protected fieldById(id: string): ListField | undefined {
    return this.fieldMap().get(id);
  }

  protected tagLookup(id: string): { name: string; color: string } | undefined {
    return this.tagMap().get(id);
  }

  protected formatField(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  protected resolveImage(item: ListItem): string | null {
    const field = this.imageField();
    if (!field) return null;
    const raw = item.customFields[field.id];
    if (typeof raw !== 'string' || !raw) return null;
    return this.uploads.resolveUrl(raw);
  }

  protected resolveImageUrl(value: unknown): string | null {
    return typeof value === 'string' ? this.uploads.resolveUrl(value) : null;
  }

  protected reload(): void {
    this.service.listItems(this.id, { q: this.search || undefined }).subscribe({
      next: (items) => this.rawItems.set(items),
      error: (err: HttpErrorResponse) => this.toastr.error(this.errMsg(err)),
    });
  }

  protected setTemplate(template: GridTemplate): void {
    if (template === 'card') {
      const g = this.gridConfig();
      this.patchGridConfig({
        template: 'card',
        cardShape: g.cardShape ?? this.cardShape(),
        textPosition: g.textPosition ?? this.textPosition(),
      });
      return;
    }
    this.patchGridConfig({ template });
  }

  protected setCardShape(cardShape: CardShape): void {
    this.patchGridConfig({ template: 'card', cardShape });
  }

  protected setTextPosition(textPosition: TextPosition): void {
    this.patchGridConfig({ template: 'card', textPosition });
  }

  protected toggleTextBg(): void {
    this.patchGridConfig({ template: 'card', textBackground: !this.textBg() });
  }

  protected setGroupBy(groupBy: string | null): void {
    this.patchViewConfig({ groupBy });
  }

  protected setSortBy(sortBy: string): void {
    this.patchViewConfig({ sortBy });
  }

  protected toggleSortDir(): void {
    const current = this.viewConfig().sortDir;
    this.patchViewConfig({ sortDir: current === 'asc' ? 'desc' : 'asc' });
  }

  private patchGridConfig(patch: Partial<GridConfig>): void {
    const current = this.gridConfig();
    const next = { ...current, ...patch };
    const list = this.list();
    if (!list) return;
    this.list.set({ ...list, gridConfig: next });
    this.service.update(this.id, { gridConfig: next }).subscribe({
      error: () => this.toastr.error('Could not save the settings'),
    });
  }

  private patchViewConfig(patch: Partial<ViewConfig>): void {
    const current = this.viewConfig();
    const next = { ...current, ...patch };
    const list = this.list();
    if (!list) return;
    this.list.set({ ...list, viewConfig: next });
    this.service.update(this.id, { viewConfig: next }).subscribe({
      error: () => this.toastr.error('Could not save the settings'),
    });
  }

  private applySort(items: ListItem[], config: ViewConfig): ListItem[] {
    const sorted = [...items];
    const dir = config.sortDir === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let va: unknown;
      let vb: unknown;
      if (config.sortBy === 'title') {
        va = a.title;
        vb = b.title;
      } else if (config.sortBy === 'createdAt') {
        va = a.createdAt;
        vb = b.createdAt;
      } else {
        va = a.customFields[config.sortBy];
        vb = b.customFields[config.sortBy];
      }

      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return sorted;
  }

  private loadList(): void {
    this.loading.set(true);
    this.service.findById(this.id).subscribe({
      next: (list) => {
        this.list.set(list);
        this.reload();
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toastr.error(this.errMsg(err));
        void this.router.navigate(['/app/lists']);
      },
    });
  }

  protected openCardStyle(): void {
    this.dialog
      .open<CardStyleDialogComponent, CardStyleDialogData, CardStyle | undefined>(
        CardStyleDialogComponent,
        { data: { cardStyle: this.cardStyle() }, width: 'min(720px, 96vw)', maxWidth: '96vw' },
      )
      .afterClosed()
      .subscribe((style) => {
        if (style) this.patchGridConfig({ cardStyle: style });
      });
  }

  protected openCreateItem(): void {
    const list = this.list();
    if (!list) return;
    const ref = this.dialog.open<ListItemDialogComponent, ListItemDialogData, ListItemDialogResult>(
      ListItemDialogComponent,
      { data: { list }, width: 'min(620px, 95vw)', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((item) => {
      if (item !== undefined) this.reload();
    });
  }

  protected openEditItem(item: ListItem): void {
    const list = this.list();
    if (!list) return;
    const ref = this.dialog.open<ListItemDialogComponent, ListItemDialogData, ListItemDialogResult>(
      ListItemDialogComponent,
      { data: { list, item }, width: 'min(620px, 95vw)', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe(() => this.reload());
  }

  protected openSettings(): void {
    const list = this.list();
    if (!list) return;
    const ref = this.dialog.open<ListSettingsComponent, ListSettingsData, 'changed' | 'deleted' | undefined>(
      ListSettingsComponent,
      { data: { list }, width: 'min(680px, 95vw)', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((result) => {
      if (result === 'deleted') {
        void this.router.navigate(['/app/lists']);
      } else if (result === 'changed') {
        this.loadList();
      }
    });
  }

  private errMsg(err: HttpErrorResponse): string {
    const body = err.error as { error?: { message?: string | string[] } } | null;
    const msg = body?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    return 'Unexpected error';
  }
}
