with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

modal_html = """
    <!-- Goal Detail Modal -->
    <div id="goal-detail-modal" class="modal-overlay hidden" style="z-index: 1100;">
        <div class="modal-container piece-detail-container" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header piece-detail-header">
                <div class="piece-detail-title-group">
                    <span class="piece-detail-kicker" id="goal-detail-type">OBJETIVO / MINIFIGURA</span>
                    <h2 id="goal-detail-title">Nombre del Objetivo</h2>
                </div>
                <button id="btn-close-goal-detail" class="modal-close-btn" aria-label="Cerrar">&times;</button>
            </div>

            <div class="modal-body piece-detail-body">
                <div class="piece-detail-layout">
                    <!-- Left Column: Large Image Presentation -->
                    <div class="piece-detail-visual" style="flex: 0 0 300px;">
                        <div class="piece-detail-img-box">
                            <span id="goal-detail-id-badge" class="piece-detail-code-badge">#----</span>
                            <img id="goal-detail-image" src="images/placeholder.png" alt="Objetivo" class="piece-detail-large-img" style="object-fit: contain; max-height: 300px;">
                        </div>
                        <div class="piece-external-grid" style="margin-top: 15px;">
                            <a id="goal-detail-rebrickable-link" href="#" target="_blank" class="btn-market-link">
                                <div class="market-info">
                                    <span class="market-name">Rebrickable</span>
                                </div>
                            </a>
                            <a id="goal-detail-bricklink-link" href="#" target="_blank" class="btn-market-link link-bricklink">
                                <div class="market-info">
                                    <span class="market-name">BrickLink</span>
                                </div>
                            </a>
                            <a id="goal-detail-brickeconomy-link" href="#" target="_blank" class="btn-market-link" style="border-left: 4px solid #28a745;">
                                <div class="market-info">
                                    <span class="market-name">BrickEconomy</span>
                                </div>
                            </a>
                        </div>
                    </div>

                    <!-- Right Column: Sets -->
                    <div class="piece-detail-info" style="flex: 1;">
                        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Sets en los que aparece</h3>
                        <div id="goal-detail-sets-loading" class="spinner hidden"></div>
                        <div id="goal-detail-sets-grid" class="parts-inventory-grid">
                            <!-- Sets dynamically populated here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
"""

if 'id="goal-detail-modal"' not in html:
    html = html.replace('<!-- Scripts -->', modal_html + '\n    <!-- Scripts -->')
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
