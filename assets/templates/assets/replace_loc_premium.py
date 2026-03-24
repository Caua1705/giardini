import os
import re

filepath = r"c:\Users\Arenapc\Desktop\PROJETOS\artools_novo\assets\templates\assets\hero_premium.html"

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

new_content = """  <!-- ══ SECTION 4: LOCALIZAÇÃO (GEMINI 3 AESTHETIC) ════════════════════════════ -->
  <style>
    .loc-flashlight::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(43,74,59,0.08), transparent 50%);
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: none;
      z-index: 1;
    }
    .loc-flashlight:hover::before { opacity: 1; }
    
    @keyframes textSlideLoc {
      0% { transform: translateY(110%); opacity: 0; filter: blur(8px); }
      100% { transform: translateY(0); opacity: 1; filter: blur(0px); }
    }
    .anim-text-slide.is-visible {
      animation: textSlideLoc 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .loc-beam-container {
      position: relative; display: inline-flex; border-radius: 9999px; padding: 1.5px; overflow: hidden; background: rgba(26, 26, 26, 0.1);
    }
    .loc-beam-container .loc-beam-border {
      position: absolute; inset: -400%; background: conic-gradient(from 0deg at 50% 50%, transparent 70%, var(--c-primary) 100%, transparent 100%);
      animation: rotate-beam 3.5s linear infinite; z-index: 0;
    }
    .loc-lift { transition: transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.6s cubic-bezier(0.16,1,0.3,1); border-color: transition 0.4s; }
    .loc-lift:hover { transform: translateY(-6px); box-shadow: 0 30px 60px -15px rgba(26,26,26,0.06); border-color: rgba(26,26,26,0.1); }
  </style>
  <section id="location" class="py-40 md:py-56 px-8 w-full relative z-[60] bg-[var(--c-bg)] overflow-hidden"
    style="border-top: 1px solid rgba(26,26,26,0.06);">
    <!-- Grid -->
    <div class="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32 items-start relative z-10 w-full perspective-2000">
      
      <!-- ESQUERDA: Conteúdo -->
      <div class="lg:col-span-5 flex flex-col pt-8">
        
        <!-- Label -->
        <div class="anim-fade-blur flex items-center gap-4 mb-14">
          <span class="text-[9px] md:text-[10px] text-[var(--c-dark)] font-bold uppercase tracking-[0.3em] opacity-40">04 — Localização</span>
        </div>
        
        <!-- Title with Gemini Split Slide effect -->
        <h2 style="font-family:'Instrument Serif',serif; letter-spacing:-0.03em;"
          class="text-[4.5rem] md:text-[7rem] leading-[0.85] text-[var(--c-dark)] mb-10">
          <span class="overflow-hidden block"><span class="inline-block transform translate-y-[110%] opacity-0 anim-text-slide" style="animation-delay: 0.1s">Visite Nossa</span></span>
          <span class="overflow-hidden block"><span class="italic text-[var(--c-primary)] font-light inline-block transform translate-y-[110%] opacity-0 anim-text-slide" style="animation-delay: 0.2s">Casa</span></span>
        </h2>
        
        <!-- Description -->
        <p class="anim-fade-blur text-[var(--c-dark)]/60 font-light text-lg md:text-xl leading-relaxed max-w-[420px] mb-20">
          Um espaço pensado para ser vivido com calma. Do café ao ambiente, cada detalhe convida você a permanecer.
        </p>
        
        <div class="space-y-6 mb-16 relative">
          <!-- ENDEREÇO (Flashlight Card) -->
          <div class="loc-flashlight relative group loc-lift overflow-hidden bg-[rgba(255,255,255,0.4)] backdrop-blur-md border border-[var(--c-dark)]/5 rounded-[24px] p-8 md:p-10 anim-fade-blur" onmousemove="const rect = this.getBoundingClientRect(); this.style.setProperty('--mouse-x', (event.clientX - rect.left) + 'px'); this.style.setProperty('--mouse-y', (event.clientY - rect.top) + 'px');">
            <!-- Inner content to sit above the before pseudo-element -->
            <div class="relative z-10 pointer-events-none">
              <h4 class="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--c-dark)]/40 mb-5 transition-colors group-hover:text-[var(--c-primary)]/70">Endereço</h4>
              <p class="text-[1.3rem] md:text-[1.6rem] tracking-tight text-[var(--c-dark)]/90 leading-snug font-medium mb-2 font-display">
                Rua Tavares Coutinho, 580
              </p>
              <p class="text-[0.95rem] text-[var(--c-dark)]/50 font-light">Varjota, Fortaleza — CE</p>
            </div>
          </div>
          
          <!-- HORÁRIOS (Flashlight Card) -->
          <div class="loc-flashlight relative group loc-lift overflow-hidden bg-[rgba(255,255,255,0.4)] backdrop-blur-md border border-[var(--c-dark)]/5 rounded-[24px] p-8 md:p-10 anim-fade-blur" onmousemove="const rect = this.getBoundingClientRect(); this.style.setProperty('--mouse-x', (event.clientX - rect.left) + 'px'); this.style.setProperty('--mouse-y', (event.clientY - rect.top) + 'px');">
            <div class="relative z-10 pointer-events-none flex flex-col gap-6">
              <h4 class="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--c-dark)]/40 transition-colors group-hover:text-[var(--c-primary)]/70">Horários</h4>
              <div class="flex justify-between items-end border-b border-[var(--c-dark)]/5 pb-4">
                <p class="text-[0.9rem] text-[var(--c-dark)]/50 font-medium">Terça a Sábado</p>
                <p class="text-[1.1rem] md:text-[1.2rem] text-[var(--c-dark)]/90 font-semibold tracking-tight">07:00 – 20:00</p>
              </div>
              <div class="flex justify-between items-end pt-1">
                <p class="text-[0.9rem] text-[var(--c-dark)]/50 font-medium">Domingo</p>
                <div class="flex flex-col items-end gap-1">
                  <p class="text-[1.1rem] md:text-[1.2rem] text-[var(--c-dark)]/90 font-semibold tracking-tight">07:00 – 11:00</p>
                  <p class="text-[1.1rem] md:text-[1.2rem] text-[var(--c-dark)]/90 font-semibold tracking-tight">15:00 – 19:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BUTTON: Gemini Beam Border Style -->
        <div class="anim-fade-blur mt-8">
          <a href="https://maps.google.com" target="_blank"
            class="loc-beam-container group w-full max-w-[320px] transition-transform duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(26,26,26,0.15)]">
            <div class="loc-beam-border"></div>
            <div class="relative z-10 flex w-full h-full items-center justify-between rounded-full bg-[var(--c-dark)] px-8 py-5 border border-white/10 shadow-inner">
              <span class="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-[var(--c-bg)] flex items-center gap-3">
                <iconify-icon class="text-lg opacity-70" icon="solar:map-point-wave-bold-duotone"></iconify-icon>
                Como chegar
              </span>
              <span class="text-xl text-white/50 transition-all duration-500 group-hover:translate-x-1 group-hover:text-[var(--c-primary)]">
                <iconify-icon icon="solar:arrow-right-bold-duotone"></iconify-icon>
              </span>
            </div>
          </a>
        </div>
      </div>
      
      <!-- DIREITA: Mapa Interativo 3D Glass -->
      <div class="lg:col-span-7 w-full h-full flex items-center mt-16 lg:mt-0 anim-fade-blur" style="perspective: 2000px;">
        <!-- 3D Transform wrapper -->
        <div class="relative w-full aspect-[3/4] md:aspect-[3/3.2] rounded-[48px] overflow-hidden p-[2px] cursor-pointer bg-white/10 transition-all duration-1000 transform-style-3d hover:rotate-y-[-2deg] hover:rotate-x-[1deg] hover:-translate-y-4 hover:shadow-[0_40px_100px_-20px_rgba(26,26,26,0.15)] shadow-[0_20px_50px_-10px_rgba(26,26,26,0.06)] group border border-[var(--c-dark)]/5" onclick="window.open('https://maps.google.com', '_blank')">
          
          <div class="w-full h-full rounded-[46px] overflow-hidden relative bg-[#EAE4D9]">
            <!-- Subtle noise over the map container -->
            <div class="absolute inset-0 z-20 opacity-[0.25] pointer-events-none mix-blend-multiply" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.15\'/%3E%3C/svg%3E');"></div>
            
            <!-- Warm desaturation overlay -->
            <div class="absolute inset-0 z-10 bg-[var(--c-bg)] mix-blend-color opacity-80 pointer-events-none transition-opacity duration-1000 group-hover:opacity-40"></div>
            <div class="absolute inset-0 z-10 bg-[#EAE4D9] mix-blend-multiply opacity-30 pointer-events-none transition-opacity duration-1000 group-hover:opacity-10"></div>
            
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.365314751761!2d-38.4870535!3d-3.7303038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c7487cbbacbb21%3A0x67ee1c8dcab0fc41!2sR.%20Tavares%20Coutinho%2C%20580%20-%20Varjota%2C%20Fortaleza%20-%20CE%2C%2060165-080!5e0!3m2!1spt-BR!2sbr!4v1710000000000!5m2!1spt-BR!2sbr"
              class="absolute top-[-5%] left-[-5%] w-[110%] h-[110%] border-0 object-cover pointer-events-none filter grayscale-[50%] contrast-[1.05] opacity-80 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grayscale-[20%] group-hover:opacity-100 group-hover:scale-[1.05]"
              allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
            </iframe>
            
            <!-- Floating interactive light -->
            <div class="absolute inset-0 z-[15] pointer-events-none bg-[radial-gradient(1000px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.4),transparent_40%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </div>
    </div>
  </section>"""

# Using regex to match the REFINED location block that I injected earlier.
# If it's not the REFINED one, it might be the original commented out one still!
# Wait, I uncommented it in the previous step and it had "LOCALIZAÇÃO (REFINED)"
pattern = re.compile(r'<!--\s*══ SECTION 4: LOCALIZAÇÃO \(REFINED\)[\s\S]*?</section>', re.IGNORECASE)

# Or, if that fails, match the old section using its ID up to its modal
fallback_pattern = re.compile(r'<!--\s*══ SECTION 4: LOCALIZAÇÃO[\s\S]*?id="location-modal-content"[\s\S]*?</div>\s*</div>\s*(?:-->)?', re.IGNORECASE)

match = pattern.search(html)
if match:
    print("Found REFINED commented block! Replacing successfully.")
    html = pattern.sub(new_content, html)
else:
    print("Could not find REFINED block. Attempting fallback match on original block...")
    match_fallback = fallback_pattern.search(html)
    if match_fallback:
        print("Found ORIGINAL commented block! Replacing successfully.")
        html = fallback_pattern.sub(new_content, html)
    else:
        print("Failed to match either block! Please check HTML.")

# In addition, we need to bind the anim-text-slide elements inside the document.querySelectorAll('.anim-text-slide') to observer
# inside the initInViewAnimations if possible, or just add them to the .anim-fade-blur class triggering
# Actually, I added `.anim-text-slide` to have `.is-visible` added. The observer loops through `.anim-fade-blur` usually.
# Let me replace `.anim-text-slide` with `.anim-fade-blur anim-text-slide` to piggy-back on existing GSAP/Observer
# Wait, I already added `.anim-text-slide` in my HTML. Let's make sure it's also targeted.
# It is better to just put `anim-fade-blur` on the same element so GSAP applies `is-visible`.
# Wait, in the GSAP code of hero_premium.html, `blur-reveal` or `anim-fade-blur` are triggered by ScrollTrigger.
# In `hero_premium.html`, `anim-fade-blur` is used and GSAP `ScrollTrigger` toggles the `.is-visible` class!
# Let me update the HTML string to include `anim-fade-blur` on the span elements directly, and the `anim-text-slide` class will just override the animation rule!

html = html.replace('class="inline-block transform translate-y-[110%] opacity-0 anim-text-slide"',
                    'class="inline-block transform translate-y-[110%] opacity-0 anim-text-slide anim-fade-blur"')

# For the map flashlight to work, we need onmousemove
html = html.replace('class="relative w-full aspect-[3/4] md:aspect-[3/3.2] rounded-[48px] overflow-hidden p-[2px]',
                    'onmousemove="const rect = this.getBoundingClientRect(); this.style.setProperty(\'--mouse-x\', (event.clientX - rect.left) + \'px\'); this.style.setProperty(\'--mouse-y\', (event.clientY - rect.top) + \'px\');" class="relative w-full aspect-[3/4] md:aspect-[3/3.2] rounded-[48px] overflow-hidden p-[2px]')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated hero_premium.html with extreme premium UI")
