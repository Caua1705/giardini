import os
import re

filepath = r"c:\Users\Arenapc\Desktop\PROJETOS\artools_novo\assets\templates\assets\hero_premium.html"

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

new_content = """  <!-- ══ SECTION 4: LOCALIZAÇÃO (ULTIMATE EDITORIAL) ════════════════════════════ -->
  <style>
    /* ── ANIMATIONS ─────────── */
    @keyframes editorialReveal {
      0% { transform: translateY(120%); opacity: 0; filter: blur(12px) skewY(5deg); }
      100% { transform: translateY(0); opacity: 1; filter: blur(0px) skewY(0deg); }
    }
    
    .ed-reveal {
      opacity: 0;
    }
    .ed-reveal.is-visible {
      animation: editorialReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes slow-orb {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-40px, 30px) scale(1.1); }
    }

    .ed-watermark {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      position: absolute;
      right: 0%;
      top: 50%;
      transform: translateY(-50%) translateX(20%);
      font-size: clamp(10rem, 25vw, 30rem);
      line-height: 0.8;
      font-family: 'Instrument Serif', serif;
      color: rgba(26,26,26,0.012);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 1;
    }
    
    /* Premium Button (Retained) */
    .loc-beam-container {
      position: relative; display: inline-flex; border-radius: 9999px; padding: 1.5px; overflow: hidden; background: rgba(26, 26, 26, 0.1);
    }
    .loc-beam-container .loc-beam-border {
      position: absolute; inset: -400%; background: conic-gradient(from 0deg at 50% 50%, transparent 70%, var(--c-primary) 100%, transparent 100%);
      animation: rotate-beam 3.5s linear infinite; z-index: 0;
    }
    
    .ed-map-container {
      transition: transform 1.2s cubic-bezier(0.16,1,0.3,1), box-shadow 1.2s cubic-bezier(0.16,1,0.3,1);
    }
    .ed-map-container:hover {
      transform: scale(0.98) translateY(-4px);
      box-shadow: 0 40px 80px -20px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(26,26,26,0.08);
    }
    
    .ed-data-row {
      position: relative;
    }
    
    /* Fine-line hover effects */
    .ed-fine-line {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(26,26,26,0.1);
      overflow: hidden;
    }
    .ed-fine-line::after {
      content: '';
      position: absolute;
      top: -100%;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--c-primary);
      transition: top 0.6s cubic-bezier(0.16,1,0.3,1);
    }
    .ed-data-row:hover .ed-fine-line::after {
      top: 0;
    }
  </style>
  
  <section id="location" class="py-40 md:py-64 w-full relative z-[60] bg-[#FAEDE0]/20 overflow-hidden" style="border-top: 1px solid rgba(26,26,26,0.04);">
    
    <!-- Atmospheric Orbs & Watermark -->
    <div class="ed-watermark">Giardini</div>
    <div class="absolute top-[20%] left-[-10%] w-[800px] h-[800px] bg-[#EAE4D9] rounded-full mix-blend-multiply blur-[120px] opacity-40 pointer-events-none" style="animation: slow-orb 30s ease-in-out infinite;"></div>
    <div class="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[var(--c-primary)] rounded-full mix-blend-overlay blur-[150px] opacity-[0.03] pointer-events-none" style="animation: slow-orb 25s ease-in-out infinite reverse;"></div>
    
    <!-- Core Grid -->
    <div class="max-w-[1340px] px-8 md:px-12 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24 lg:gap-16 items-start relative z-10 w-full">
      
      <!-- ESQUERDA: Tipografia Editorial Pura -->
      <div class="lg:col-span-5 flex flex-col pt-4">
        
        <!-- Label minimalista transversal -->
        <div class="anim-fade-blur flex items-center gap-6 mb-16 relative">
          <span class="w-12 h-px bg-[var(--c-dark)] opacity-[0.15] block"></span>
          <span class="text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--c-dark)] opacity-40">Section — 04</span>
        </div>
        
        <!-- Título Monumental GSAP Ready -->
        <h2 style="font-family:'Instrument Serif',serif; letter-spacing:-0.04em;" class="text-[5rem] md:text-[7.5rem] leading-[0.82] text-[var(--c-dark)] mb-10 overflow-hidden pb-4">
          <span class="block overflow-hidden"><span class="block ed-reveal" style="animation-delay: 0.1s">Visite</span></span>
          <span class="block overflow-hidden"><span class="block ed-reveal" style="animation-delay: 0.2s">Nossa <span class="italic text-[var(--c-primary)] font-light pr-4">Casa</span></span></span>
        </h2>
        
        <!-- Descrição Editorial -->
        <div class="overflow-hidden mb-24">
          <p class="text-[var(--c-dark)]/65 font-light text-xl md:text-2xl pt-2 leading-[1.6] max-w-[420px] ed-reveal" style="animation-delay: 0.3s">
            Um espaço minuciosamente planejado para que você perca a noção do tempo. O convite é simples: sinta-se em casa.
          </p>
        </div>
        
        <!-- DADOS ESTRUTURAIS PURA (Naked lines) -->
        <div class="space-y-16 mb-20 relative">
          
          <!-- ENDEREÇO -->
          <div class="ed-data-row pl-10 pr-2 pb-2 group">
            <div class="ed-fine-line"></div>
            <div class="ed-reveal" style="animation-delay: 0.4s">
              <h4 class="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--c-dark)]/30 mb-6 transition-colors group-hover:text-[var(--c-primary)]/60">Localização</h4>
              <p class="text-2xl md:text-3xl text-[var(--c-dark)]/90 leading-tight mb-3 font-display tracking-tight group-hover:text-[var(--c-dark)] transition-colors">
                Rua Tavares Coutinho, 580
              </p>
              <p class="text-sm text-[var(--c-dark)]/40 font-medium tracking-wide uppercase">Varjota, Fortaleza — CE</p>
            </div>
          </div>
          
          <!-- HORÁRIOS -->
          <div class="ed-data-row pl-10 pr-2 group">
            <div class="ed-fine-line"></div>
            <div class="ed-reveal flex flex-col gap-8" style="animation-delay: 0.5s">
              <h4 class="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--c-dark)]/30 transition-colors group-hover:text-[var(--c-primary)]/60">Rotina</h4>
              
              <!-- Terça a Sábado -->
              <div>
                <p class="text-xs text-[var(--c-dark)]/40 font-bold uppercase tracking-[0.2em] mb-2">Terça a Sábado</p>
                <p class="text-4xl text-[var(--c-dark)]/85 tracking-tighter font-display leading-none group-hover:text-[var(--c-dark)] transition-colors">07:00 – 20:00</p>
              </div>
              
              <!-- Domingo -->
              <div>
                <p class="text-xs text-[var(--c-dark)]/40 font-bold uppercase tracking-[0.2em] mb-2">Domingos Especiais</p>
                <div class="flex items-center gap-4">
                  <p class="text-2xl text-[var(--c-dark)]/85 tracking-tighter font-display leading-none group-hover:text-[var(--c-dark)] transition-colors">07:00 – 11:00</p>
                  <span class="w-1 h-1 rounded-full bg-[var(--c-dark)]/15"></span>
                  <p class="text-2xl text-[var(--c-dark)]/85 tracking-tighter font-display leading-none group-hover:text-[var(--c-dark)] transition-colors">15:00 – 19:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BUTTON: Retained Gemini Style -->
        <div class="ed-reveal" style="animation-delay: 0.6s">
          <a href="https://maps.google.com" target="_blank"
            class="loc-beam-container group w-full max-w-[320px] transition-transform duration-700 hover:scale-[1.01]">
            <div class="loc-beam-border"></div>
            <div class="relative z-10 flex w-full h-full items-center justify-between rounded-full bg-[var(--c-dark)] px-8 py-5 border border-white/5 shadow-2xl">
              <span class="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-white flex items-center gap-3">
                <iconify-icon class="text-lg opacity-60 text-[var(--c-primary)]" icon="solar:map-point-wave-bold-duotone"></iconify-icon>
                Como Chegar
              </span>
              <span class="text-xl text-white/40 transition-all duration-700 group-hover:translate-x-1 group-hover:text-white">
                <iconify-icon icon="solar:round-alt-arrow-right-bold-duotone"></iconify-icon>
              </span>
            </div>
          </a>
        </div>
      </div>
      
      <!-- DIREITA: Mapa Asymmetrical Cinematic -->
      <div class="lg:col-span-7 w-full h-full flex items-center mt-20 lg:mt-0 relative" style="perspective: 2000px;">
        
        <!-- Large backdrop shadow block extending the bleed effect -->
        <div class="absolute inset-y-8 left-12 right-[-20%] bg-[#EAE4D9]/40 z-0 hidden lg:block ed-reveal" style="animation-delay: 0.3s"></div>
        
        <div class="ed-map-container relative z-10 w-[105%] md:w-full ml-[-2.5%] md:ml-0 aspect-[4/5] md:aspect-[5/6] overflow-hidden p-[1px] cursor-pointer bg-white/40 ed-reveal group" style="animation-delay: 0.4s" onclick="window.open('https://maps.google.com', '_blank')">
          <div class="w-full h-full overflow-hidden relative bg-[#EAE4D9]">
            
            <!-- Heavy Noise Grain for Print feel -->
            <div class="absolute inset-0 z-20 opacity-[0.35] pointer-events-none mix-blend-multiply" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.25\'/%3E%3C/svg%3E');"></div>
            
            <!-- Cinematic Color Grade Overlays -->
            <div class="absolute inset-0 z-10 bg-[var(--c-bg)] mix-blend-color opacity-90 pointer-events-none transition-opacity duration-1000 group-hover:opacity-40"></div>
            <div class="absolute inset-0 z-10 bg-[var(--c-primary)] mix-blend-color opacity-30 pointer-events-none transition-opacity duration-1000 group-hover:opacity-0"></div>
            <div class="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.15)_100%)] pointer-events-none"></div>
            
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.365314751761!2d-38.4870535!3d-3.7303038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c7487cbbacbb21%3A0x67ee1c8dcab0fc41!2sR.%20Tavares%20Coutinho%2C%20580%20-%20Varjota%2C%20Fortaleza%20-%20CE%2C%2060165-080!5e0!3m2!1spt-BR!2sbr!4v1710000000000!5m2!1spt-BR!2sbr"
              class="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] border-0 object-cover pointer-events-none filter grayscale-[70%] contrast-[1.1] opacity-70 transition-all duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grayscale-[20%] group-hover:opacity-[0.85] group-hover:scale-[1.03]"
              allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
            </iframe>
            
            <div class="absolute bottom-8 left-8 right-8 flex justify-between items-end z-20 pointer-events-none px-2 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <span class="text-[9px] font-bold uppercase tracking-widest drop-shadow-md">Navegação via maps</span>
              <span class="text-[10px] uppercase font-mono tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">Giardini</span>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </section>"""

# Using regex to match the GEMINI 3 location block that I injected earlier.
pattern = re.compile(r'<!--\s*══ SECTION 4: LOCALIZAÇÃO \(GEMINI 3 AESTHETIC\)[\s\S]*?</section>', re.IGNORECASE)
fallback_pattern = re.compile(r'<!--\s*══ SECTION 4: LOCALIZAÇÃO \(REFINED\)[\s\S]*?</section>', re.IGNORECASE)

match = pattern.search(html)
if match:
    print("Found GEMINI 3 commented block! Replacing successfully.")
    html = pattern.sub(new_content, html)
else:
    print("Could not find GEMINI 3 block. Attempting fallback match on REFINED block...")
    match_fallback = fallback_pattern.search(html)
    if match_fallback:
        print("Found REFINED commented block! Replacing successfully.")
        html = fallback_pattern.sub(new_content, html)
    else:
        print("Failed to match either block! Please check HTML.")

# Add `anim-fade-blur` implicitly to all `.ed-reveal` elements so they trigger automatically through existing scrolling mechanisms,
# because the original code's Javascript tracks `.anim-fade-blur.is-visible` via an Intersection Observer!
# Let's ensure GSAP hits them by replacing `ed-reveal"` with `ed-reveal anim-fade-blur"` or `ed-reveal" class="..."` 
# I can just put `anim-fade-blur` right next to `ed-reveal`. 

html = html.replace('ed-reveal"', 'ed-reveal anim-fade-blur"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated hero_premium.html with ULTIMATE EDITORIAL UI")
