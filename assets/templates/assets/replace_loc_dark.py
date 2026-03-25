#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Replace Section 5: Localizacao with premium dark editorial redesign.
"""

import re

FILE = 'hero_premium.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── Find boundaries ─────────────────────────────────────────────────────────
# The old section is surrounded by these two unique anchors
START = '      <!-- \u2550\u2550 SECTION 5'
END_TAG = '  </section>\n\n  <!-- \u2550\u2550 FOOTER PREMIUM'

# Fallback: search without the comment continuation
start_idx = content.find(START)
if start_idx == -1:
    # Try relaxed search
    start_idx = content.find('SECTION 5: LOCALIZA')
    if start_idx != -1:
        # Backtrack to find the comment opener
        while start_idx > 0 and content[start_idx] != '<':
            start_idx -= 1

print(f"START idx: {start_idx}")
print(f"Context: {repr(content[start_idx:start_idx+60])}")

end_idx = content.find(END_TAG, start_idx)
print(f"END idx: {end_idx}")
if end_idx != -1:
    end_idx_final = end_idx + len('  </section>')
    print(f"End context: {repr(content[end_idx:end_idx_final+10])}")

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not find section boundaries!")
    print("Looking for 'SECTION 5'...")
    idx = content.find('SECTION 5')
    print(f"Found at {idx}: {repr(content[max(0,idx-50):idx+100])}")
    exit(1)

# ── New section content ──────────────────────────────────────────────────────
NEW_SECTION = r"""<!-- == SECTION 5: LOCALIZACAO DARK EDITORIAL PREMIUM ======================== -->
  <style>
    /* ── SECTION 5 DARK ATMOSPHERIC ──── */
    #location {
      background: #0e1612;
      position: relative;
      overflow: hidden;
    }

    /* Grain overlay */
    .loc-dark-grain {
      position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0.038;
      background-image: url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E');
      background-size: 180px 180px;
    }

    /* Top golden accent line */
    .loc-dark-top-line {
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(to right,
        transparent,
        rgba(183,147,88,0.4) 25%,
        rgba(255,255,255,0.12) 50%,
        rgba(183,147,88,0.4) 75%,
        transparent);
      z-index: 5;
    }

    /* Ambient orbs on dark bg */
    .loc-dark-orb-1 {
      position: absolute; top: -5%; right: -5%; width: 55vw; height: 55vw;
      border-radius: 50%; pointer-events: none; z-index: 1;
      background: radial-gradient(circle, rgba(43,74,59,0.22) 0%, transparent 60%);
      animation: loc-orb-1 24s ease-in-out infinite;
    }
    .loc-dark-orb-2 {
      position: absolute; bottom: -10%; left: -5%; width: 45vw; height: 45vw;
      border-radius: 50%; pointer-events: none; z-index: 1;
      background: radial-gradient(circle, rgba(183,147,88,0.14) 0%, transparent 60%);
      animation: loc-orb-2 30s ease-in-out infinite 4s;
    }

    /* Dot grid */
    .loc-dark-dots {
      position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.055;
      background-image: radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px);
      background-size: 52px 52px;
      -webkit-mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.5) 80%, transparent);
      mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.5) 80%, transparent);
    }

    /* Horizontal rhythm lines */
    .loc-dark-rhythm { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
    .loc-dark-rhythm div { position: absolute; left: 0; right: 0; height: 1px; }

    /* Golden section badge */
    .loc-section-badge {
      display: inline-flex; align-items: center; gap: 0.55rem;
      padding: 0.3rem 0.9rem; border-radius: 9999px;
      border: 1px solid rgba(183,147,88,0.28);
      background: rgba(183,147,88,0.07);
      backdrop-filter: blur(10px);
      flex-shrink: 0;
    }

    /* Location map overlay bar */
    .loc-map-bar {
      position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
      padding: 1.8rem 1.8rem 1.6rem;
      background: linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.6) 60%, transparent 100%);
      display: flex; align-items: flex-end; justify-content: space-between;
      transition: all 0.8s ease;
    }

    /* Map corner brackets */
    .loc-corner {
      position: absolute; width: 20px; height: 20px; z-index: 25; pointer-events: none;
      transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
    }
    .loc-corner-tl { top: 14px; left: 14px; border-top: 1.5px solid rgba(183,147,88,0.55); border-left: 1.5px solid rgba(183,147,88,0.55); }
    .loc-corner-tr { top: 14px; right: 14px; border-top: 1.5px solid rgba(183,147,88,0.55); border-right: 1.5px solid rgba(183,147,88,0.55); }
    .loc-corner-bl { bottom: 14px; left: 14px; border-bottom: 1.5px solid rgba(183,147,88,0.55); border-left: 1.5px solid rgba(183,147,88,0.55); }
    .loc-corner-br { bottom: 14px; right: 14px; border-bottom: 1.5px solid rgba(183,147,88,0.55); border-right: 1.5px solid rgba(183,147,88,0.55); }
    .ed-map-container:hover .loc-corner { width: 30px; height: 30px; }
    .ed-map-container:hover .loc-corner-tl { border-color: rgba(183,147,88,0.85); }
    .ed-map-container:hover .loc-corner-tr { border-color: rgba(183,147,88,0.85); }
    .ed-map-container:hover .loc-corner-bl { border-color: rgba(183,147,88,0.85); }
    .ed-map-container:hover .loc-corner-br { border-color: rgba(183,147,88,0.85); }

    /* Map hover lift */
    .ed-map-container {
      transition: transform 1.2s cubic-bezier(0.16,1,0.3,1), box-shadow 1.2s cubic-bezier(0.16,1,0.3,1);
    }
    .ed-map-container:hover {
      transform: scale(0.98) translateY(-5px);
      box-shadow: 0 48px 96px -24px rgba(0,0,0,0.65), 0 0 0 1px rgba(183,147,88,0.12) !important;
    }

    /* Fine line for data rows */
    .ed-fine-line-dark {
      position: absolute; left: 0; top: 0; bottom: 0; width: 1px;
      background: rgba(255,255,255,0.08); overflow: hidden;
    }
    .ed-fine-line-dark::after {
      content: '';
      position: absolute; top: -100%; left: 0; width: 100%; height: 100%;
      background: rgba(183,147,88,0.65);
      transition: top 0.65s cubic-bezier(0.16,1,0.3,1);
    }
    .ed-data-row-dark:hover .ed-fine-line-dark::after { top: 0; }
    .ed-data-row-dark { position: relative; padding-left: 2rem; }

    /* Animated divider */
    .loc-animated-divider {
      position: relative; height: 1px; overflow: hidden; margin-bottom: 3rem; max-width: 380px;
    }
    .loc-animated-divider::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(to right, rgba(255,255,255,0.06), rgba(183,147,88,0.2) 50%, transparent);
    }
    .loc-animated-divider::after {
      content: ''; position: absolute; top: 0; left: -100%; width: 40%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(183,147,88,0.5), transparent);
      animation: featDivider 3.5s ease-in-out infinite 1s;
    }

    /* Dark watermark */
    #loc-dark-wm { opacity: 0; transition: opacity 2s ease 0.5s; }

    /* Scroll reveals for dark section */
    .loc-dr {
      opacity: 0;
      transform: translateY(26px);
      filter: blur(8px);
      transition: opacity 1.1s cubic-bezier(0.16,1,0.3,1), transform 1.1s cubic-bezier(0.16,1,0.3,1), filter 1.1s cubic-bezier(0.16,1,0.3,1);
    }
    #location.loc-active .loc-dr { opacity: 1; transform: translateY(0); filter: blur(0); }
    #location.loc-active #loc-dark-wm { opacity: 1; }
    .loc-d1 { transition-delay: 0.08s; }
    .loc-d2 { transition-delay: 0.20s; }
    .loc-d3 { transition-delay: 0.32s; }
    .loc-d4 { transition-delay: 0.44s; }
    .loc-d5 { transition-delay: 0.56s; }
    .loc-d6 { transition-delay: 0.68s; }
    .loc-d7 { transition-delay: 0.80s; }
  </style>

  <!-- Cinematic gradient bleed transition FROM section above -->
  <div aria-hidden="true" style="
    position: relative;
    z-index: 58;
    height: 200px;
    margin-top: -200px;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(14,22,18,0.30) 25%,
      rgba(14,22,18,0.75) 60%,
      #0e1612 100%
    );
  "></div>

  <section id="location" class="py-32 md:py-44 w-full relative z-[60] overflow-hidden">

    <!-- BACKGROUND LAYERS -->
    <div class="loc-dark-grain" aria-hidden="true"></div>
    <div class="loc-dark-top-line" aria-hidden="true"></div>
    <div class="loc-dark-orb-1" aria-hidden="true"></div>
    <div class="loc-dark-orb-2" aria-hidden="true"></div>
    <div class="loc-dark-dots" aria-hidden="true"></div>

    <!-- Horizontal rhythm lines -->
    <div class="loc-dark-rhythm" aria-hidden="true">
      <div style="top:22%;background:linear-gradient(to right,transparent,rgba(183,147,88,0.07) 30%,rgba(183,147,88,0.07) 70%,transparent);"></div>
      <div style="top:50%;background:linear-gradient(to right,transparent,rgba(255,255,255,0.03) 20%,rgba(255,255,255,0.03) 80%,transparent);"></div>
      <div style="top:78%;background:linear-gradient(to right,transparent,rgba(183,147,88,0.05) 30%,rgba(183,147,88,0.05) 70%,transparent);"></div>
    </div>

    <!-- Central warm glow -->
    <div aria-hidden="true" style="
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:100%;height:100%;pointer-events:none;z-index:1;
      background:
        radial-gradient(ellipse 70% 55% at 62% 48%, rgba(43,74,59,0.18) 0%, transparent 65%),
        radial-gradient(ellipse 50% 40% at 30% 35%, rgba(183,147,88,0.10) 0%, transparent 60%);
    "></div>

    <!-- Watermark -->
    <div aria-hidden="true" style="
      position:absolute;left:0;top:0;width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;
      z-index:1;pointer-events:none;overflow:hidden;
    ">
      <span id="loc-dark-wm" style="
        font-family:'Instrument Serif',serif;
        font-size:clamp(7rem,18vw,18rem);
        font-style:italic;font-weight:400;letter-spacing:-0.04em;
        color:rgba(255,255,255,0.022);white-space:nowrap;user-select:none;display:block;
      ">Giardini</span>
    </div>

    <!-- MAIN GRID -->
    <div class="max-w-[1340px] px-8 md:px-12 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24 lg:gap-16 items-start relative z-10 w-full">

      <!-- LEFT: Editorial Content -->
      <div class="lg:col-span-5 flex flex-col pt-4">

        <!-- Section kicker badge (inline, horizontal) -->
        <div class="loc-dr loc-d1" style="display:flex;align-items:center;gap:1rem;margin-bottom:2.75rem;">
          <div class="loc-section-badge">
            <span style="width:5px;height:5px;border-radius:50%;background:rgba(183,147,88,0.9);flex-shrink:0;animation:live-glow 2.2s ease-in-out infinite;"></span>
            <span style="font-size:0.55rem;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:rgba(183,147,88,0.88);">05 / Localização</span>
          </div>
          <div style="flex:1;height:1px;background:linear-gradient(to right,rgba(183,147,88,0.22),transparent);"></div>
        </div>

        <!-- Monumental heading -->
        <h2 class="text-[5rem] md:text-[7.5rem] leading-[0.82] mb-10 overflow-hidden pb-4" style="font-family:'Instrument Serif',serif;letter-spacing:-0.04em;margin-top:0;color:rgba(255,255,255,0.92);">
          <span class="block overflow-hidden">
            <span class="block loc-dr loc-d2">Visite</span>
          </span>
          <span class="block overflow-hidden">
            <span class="block loc-dr loc-d3">
              <span style="font-style:italic;font-weight:300;color:rgba(183,147,88,0.9);padding-right:0.15em;">Nossa</span><span style="color:rgba(255,255,255,0.88);">Casa</span>
            </span>
          </span>
        </h2>

        <!-- Description -->
        <div class="overflow-hidden mb-10">
          <p class="loc-dr loc-d3" style="
            font-weight:300;font-size:1.05rem;
            color:rgba(255,255,255,0.40);
            line-height:1.85;max-width:400px;padding-top:0.5rem;
          ">
            Um espaço minuciosamente planejado para que você perca a noção do tempo. O convite é simples: sinta-se em casa.
          </p>
        </div>

        <!-- Animated divider -->
        <div class="loc-animated-divider loc-dr loc-d3"></div>

        <!-- Data rows -->
        <div style="display:flex;flex-direction:column;gap:3.5rem;margin-bottom:3.5rem;">

          <!-- ADDRESS -->
          <div class="ed-data-row-dark group loc-dr loc-d4">
            <div class="ed-fine-line-dark"></div>
            <h4 style="font-size:0.52rem;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.22);margin-bottom:1rem;transition:color 0.4s ease;">Localização</h4>
            <p style="font-family:'Instrument Serif',serif;font-size:1.55rem;color:rgba(255,255,255,0.88);line-height:1.15;margin-bottom:0.4rem;letter-spacing:-0.01em;transition:color 0.4s ease;" class="group-hover:text-white">
              Rua Tavares Coutinho, 580
            </p>
            <p style="font-size:0.68rem;color:rgba(255,255,255,0.25);font-weight:500;letter-spacing:0.15em;text-transform:uppercase;">Varjota · Fortaleza — CE</p>
          </div>

          <!-- HOURS -->
          <div class="ed-data-row-dark group loc-dr loc-d5">
            <div class="ed-fine-line-dark"></div>
            <h4 style="font-size:0.52rem;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.22);margin-bottom:1rem;transition:color 0.4s ease;">Rotina</h4>
            <div style="display:flex;flex-direction:column;gap:1.25rem;">
              <div>
                <p style="font-size:0.58rem;color:rgba(255,255,255,0.25);font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:0.45rem;">Terça a Sábado</p>
                <p style="font-family:'Instrument Serif',serif;font-size:2rem;color:rgba(255,255,255,0.85);letter-spacing:-0.04em;line-height:1;transition:color 0.4s ease;" class="group-hover:text-white">07:00 – 20:00</p>
              </div>
              <div>
                <p style="font-size:0.58rem;color:rgba(255,255,255,0.20);font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:0.45rem;">Domingos Especiais</p>
                <div style="display:flex;align-items:center;gap:1rem;">
                  <p style="font-family:'Instrument Serif',serif;font-size:1.3rem;color:rgba(255,255,255,0.50);letter-spacing:-0.03em;line-height:1;">07:00 – 11:00</p>
                  <span style="width:3px;height:3px;border-radius:50%;background:rgba(183,147,88,0.4);flex-shrink:0;"></span>
                  <p style="font-family:'Instrument Serif',serif;font-size:1.3rem;color:rgba(255,255,255,0.50);letter-spacing:-0.03em;line-height:1;">15:00 – 19:00</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- CTA Button -->
        <div class="loc-dr loc-d6">
          <a href="https://maps.google.com" target="_blank"
            style="
              display:inline-flex;align-items:center;gap:0.8rem;
              padding:1.05rem 2.35rem;
              font-size:0.68rem;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;
              border-radius:9999px;text-decoration:none;cursor:pointer;
              background:rgba(183,147,88,0.12);
              color:rgba(183,147,88,0.9);
              border:1px solid rgba(183,147,88,0.28);
              position:relative;overflow:hidden;
              transition:all 0.45s cubic-bezier(0.16,1,0.3,1);
              backdrop-filter:blur(12px);
            "
            onmouseenter="
              this.style.background='rgba(183,147,88,0.22)';
              this.style.borderColor='rgba(183,147,88,0.55)';
              this.style.transform='translateY(-2px)';
              this.style.boxShadow='0 16px 40px -8px rgba(183,147,88,0.25)';
              this.style.color='rgba(183,147,88,1)';
              this.querySelector('.loc-arr').style.transform='translate(3px,-3px)';
            "
            onmouseleave="
              this.style.background='rgba(183,147,88,0.12)';
              this.style.borderColor='rgba(183,147,88,0.28)';
              this.style.transform='';
              this.style.boxShadow='';
              this.style.color='rgba(183,147,88,0.9)';
              this.querySelector('.loc-arr').style.transform='';
            ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            Como Chegar
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);" class="loc-arr"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
          </a>
        </div>

      </div>

      <!-- RIGHT: Cinematic Dark Map -->
      <div class="lg:col-span-7 w-full h-full flex items-center mt-20 lg:mt-0 relative loc-dr loc-d4" style="perspective:2000px;">

        <div class="ed-map-container relative z-10 w-full md:w-[96%] mx-auto aspect-[4/5] md:aspect-[5/6] overflow-hidden group cursor-pointer" style="
          border-radius:22px;
          box-shadow:0 32px 80px -20px rgba(0,0,0,0.65),0 0 0 1px rgba(255,255,255,0.05);
          outline:1px solid rgba(255,255,255,0.03);outline-offset:6px;
        " onclick="window.open('https://maps.google.com','_blank')">

          <!-- Corner brackets -->
          <div class="loc-corner loc-corner-tl"></div>
          <div class="loc-corner loc-corner-tr"></div>
          <div class="loc-corner loc-corner-bl"></div>
          <div class="loc-corner loc-corner-br"></div>

          <div class="w-full h-full overflow-hidden relative" style="border-radius:22px;background:#1a2420;">

            <!-- Dark cinematic overlays -->
            <div style="position:absolute;inset:0;z-index:10;background:rgba(14,22,18,0.60);pointer-events:none;transition:opacity 1.2s ease;" class="group-hover:opacity-[0.15]"></div>
            <div style="position:absolute;inset:0;z-index:10;background:radial-gradient(circle at center,transparent 30%,rgba(0,0,0,0.40) 100%);pointer-events:none;"></div>
            <div style="position:absolute;inset:0;z-index:10;background:rgba(183,147,88,0.05);pointer-events:none;transition:opacity 1.2s ease;mix-blend-mode:multiply;" class="group-hover:opacity-0"></div>

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.365314751761!2d-38.4870535!3d-3.7303038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c7487cbbacbb21%3A0x67ee1c8dcab0fc41!2sR.%20Tavares%20Coutinho%2C%20580%20-%20Varjota%2C%20Fortaleza%20-%20CE%2C%2060165-080!5e0!3m2!1spt-BR!2sbr!4v1710000000000!5m2!1spt-BR!2sbr"
              class="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] border-0 pointer-events-none transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              style="filter:grayscale(88%) contrast(1.08) brightness(0.55);"
              allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
            </iframe>

            <!-- Always-visible bottom info bar -->
            <div class="loc-map-bar">
              <div>
                <p style="font-size:0.48rem;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:rgba(183,147,88,0.65);margin-bottom:0.35rem;">Endereço</p>
                <p style="font-family:'Instrument Serif',serif;font-size:1.1rem;font-style:italic;color:rgba(255,255,255,0.90);line-height:1.2;">Rua Tavares Coutinho, 580</p>
                <p style="font-size:0.57rem;color:rgba(255,255,255,0.38);letter-spacing:0.12em;text-transform:uppercase;margin-top:0.25rem;">Varjota · Fortaleza · CE</p>
              </div>
              <span style="
                font-size:0.5rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;
                color:rgba(183,147,88,0.82);
                background:rgba(183,147,88,0.1);
                backdrop-filter:blur(12px);
                padding:0.45rem 1rem;border-radius:9999px;
                border:1px solid rgba(183,147,88,0.2);
                transition:all 0.4s ease;display:inline-block;
              ">Ver no Maps →</span>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Scroll trigger script -->
    <script>
    (function(){
      var loc = document.getElementById('location');
      if (!loc) return;
      var observed = false;
      var io = new IntersectionObserver(function(entries){
        if (observed || !entries[0].isIntersecting) return;
        observed = true;
        loc.classList.add('loc-active');
        io.disconnect();
      }, { threshold: 0.10 });
      io.observe(loc);
    })();
    </script>

  </section>"""

# Perform replacement
print(f"Replacing chars {start_idx} to {end_idx_final}")
new_content = content[:start_idx] + NEW_SECTION + content[end_idx_final:]

# Write backup
with open(FILE + '.bak', 'w', encoding='utf-8') as f:
    f.write(content)
print("Backup written.")

# Write new file
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Done! Location section replaced successfully.")
print(f"Original: {len(content)} chars, New: {len(new_content)} chars.")
