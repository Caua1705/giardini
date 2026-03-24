import os
import re

filepath = r"c:\Users\Arenapc\Desktop\PROJETOS\artools_novo\assets\templates\assets\hero_premium.html"

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

new_content = """  <!-- ══ SECTION 4: LOCALIZAÇÃO (REFINED) ════════════════════════════ -->
  <section id="location" class="py-32 md:py-48 px-8 w-full relative z-[60] bg-[var(--c-bg)] overflow-hidden"
    style="border-top: 1px solid rgba(26,26,26,0.06);">
    <div class="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32 items-start relative z-10 w-full">
      
      <!-- ESQUERDA: Conteúdo da Localização -->
      <div class="lg:col-span-5 flex flex-col pt-8">
        
        <!-- Label -->
        <div class="anim-fade-blur flex items-center gap-4 mb-12">
          <span class="w-8 h-px bg-[var(--c-dark)] opacity-20 block"></span>
          <span class="text-[9px] md:text-[10px] text-[var(--c-dark)] font-bold uppercase tracking-[0.25em] opacity-60">Localização</span>
        </div>
        
        <!-- Title -->
        <h2 style="font-family:'Instrument Serif',serif; letter-spacing:-0.02em;"
          class="anim-fade-blur text-6xl md:text-[5.5rem] leading-[0.88] text-[var(--c-dark)] mb-8">
          Visite Nossa <br />
          <span class="italic text-[var(--c-primary)] font-light">Casa</span>
        </h2>
        
        <!-- Description -->
        <p class="anim-fade-blur text-[var(--c-dark)]/60 font-light text-base md:text-lg leading-relaxed max-w-[380px] mb-16">
          Um espaço pensado para ser vivido com calma. Do café ao ambiente, cada detalhe convida você a permanecer.
        </p>

        <!-- Divisão sutil -->
        <div class="anim-fade-blur w-full max-w-[380px] h-px bg-[var(--c-dark)]/5 mb-14"></div>
        
        <div class="space-y-12 mb-16">
          <!-- ENDEREÇO -->
          <div class="anim-fade-blur group">
            <h4 class="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--c-dark)]/40 mb-4 transition-colors group-hover:text-[var(--c-primary)]/60">Endereço</h4>
            <p class="text-[1.15rem] text-[var(--c-dark)]/90 leading-snug font-medium mb-1">
              Rua Tavares Coutinho, 580
            </p>
            <p class="text-[0.9rem] text-[var(--c-dark)]/50 font-light">Varjota, Fortaleza — CE</p>
          </div>
          
          <!-- HORÁRIOS -->
          <div class="anim-fade-blur group">
            <h4 class="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--c-dark)]/40 mb-4 transition-colors group-hover:text-[var(--c-primary)]/60">Horários</h4>
            <div class="flex flex-col gap-5">
              <div>
                <p class="text-[0.8rem] text-[var(--c-dark)]/50 font-light mb-1">Terça a Sábado</p>
                <p class="text-[1.1rem] text-[var(--c-dark)]/90 leading-none font-semibold uppercase tracking-wide">07:00 às 20:00</p>
              </div>
              <div>
                <p class="text-[0.8rem] text-[var(--c-dark)]/50 font-light mb-1">Domingo</p>
                <p class="text-[1.1rem] text-[var(--c-dark)]/90 leading-none font-semibold uppercase tracking-wide flex items-center">
                  07:00 às 11:00 <span class="text-[var(--c-dark)]/30 mx-2 text-xs">&middot;</span> 15:00 às 19:00
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="anim-fade-blur w-full max-w-[380px] h-px bg-[var(--c-dark)]/5 mb-12"></div>

        <!-- BUTTON -->
        <div class="anim-fade-blur">
          <a href="https://maps.google.com" target="_blank"
            class="inline-flex items-center justify-center gap-4 px-10 py-5 rounded-full border border-[var(--c-dark)]/15 bg-transparent text-[var(--c-dark)] text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--c-dark)] hover:text-[var(--c-bg)] hover:border-[var(--c-dark)] hover:shadow-[0_15px_30px_-5px_rgba(26,26,26,0.15)] hover:-translate-y-1">
            <span>Como chegar</span>
            <span class="text-lg leading-none transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
          </a>
        </div>
      </div>
      
      <!-- DIREITA: Mapa Interativo Minimalista -->
      <div class="lg:col-span-7 w-full anim-fade-blur h-full flex items-center">
        <!-- Soft rounded map container without heavy shadows, desaturated look -->
        <div
          class="relative w-full aspect-[4/3] lg:aspect-[4/3.5] rounded-[40px] overflow-hidden p-2 group cursor-pointer border border-[var(--c-dark)]/5 shadow-[0_20px_60px_-10px_rgba(26,26,26,0.06)] bg-[var(--c-bg)] transition-all duration-700 hover:shadow-[0_30px_80px_-15px_rgba(26,26,26,0.09)] hover:-translate-y-2"
          onclick="window.open('https://maps.google.com', '_blank')">
          
          <div class="w-full h-full rounded-[32px] overflow-hidden relative bg-[#E1DBD0]">
            <!-- Warm overlay filter to desaturate and match site aesthetic -->
            <div class="absolute inset-0 z-10 bg-[var(--c-bg)] mix-blend-color opacity-70 pointer-events-none transition-opacity duration-700 group-hover:opacity-40"></div>
            <div class="absolute inset-0 z-10 bg-[#E1DBD0] mix-blend-multiply opacity-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-10"></div>
            
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.365314751761!2d-38.4870535!3d-3.7303038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c7487cbbacbb21%3A0x67ee1c8dcab0fc41!2sR.%20Tavares%20Coutinho%2C%20580%20-%20Varjota%2C%20Fortaleza%20-%20CE%2C%2060165-080!5e0!3m2!1spt-BR!2sbr!4v1710000000000!5m2!1spt-BR!2sbr"
              class="absolute top-[-5%] left-[-5%] w-[110%] h-[110%] border-0 object-cover pointer-events-none filter grayscale-[40%] contrast-[0.95] opacity-80 transition-all duration-1000 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-[1.03]"
              allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </div>
    </div>
  </section>"""

# Using regex to match the exact commented block safely
# Searching for <!-- \n  ══ SECTION 4: LOCALIZAÇÃO ... -->
pattern = re.compile(r'<!--\s*\n\s*══ SECTION 4: LOCALIZAÇÃO[\s\S]*?</div>\s*</div>\s*-->', re.IGNORECASE)

match = pattern.search(html)
if match:
    print("Found commented block! Replaced successfully.")
    html = pattern.sub(new_content, html)
else:
    print("Could not find the exact commented block. Attempting fallback match...")
    # fallback if format differed
    fallback_pattern = re.compile(r'<!--[\s\S]*?LOCALIZAÇÃO[\s\S]*?id="location-modal-content"[\s\S]*?</div>\s*</div>\s*-->', re.IGNORECASE)
    html = fallback_pattern.sub(new_content, html)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated hero_premium.html")
