import { afterNextRender, Component, computed, ElementRef, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { PlanService, PlanTier, PlanFeature } from '../../../core/services/plan.service';

interface WfStep { n: string; icon: string; key: string; funcs: string[]; props: string[]; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslocoModule],
  template: `
  <!-- ═══════════════════════════ HERO ═══════════════════════════ -->
  <section class="hero" (mousemove)="tilt($event)" (mouseleave)="untilt()">
    <div class="aurora a1"></div><div class="aurora a2"></div><div class="aurora a3"></div>
    <div class="dots"></div>

    <div class="hero-grid">
      <div class="hero-copy">
        <span class="pill rv"><span class="pulse"></span>{{ 'landing.badge' | transloco }}</span>
        <h1 class="rv">{{ 'landing.heroA' | transloco }}
          <em>{{ 'landing.heroEm' | transloco }}</em>{{ 'landing.heroB' | transloco }}</h1>
        <p class="lead rv">{{ 'landing.heroSub' | transloco }}</p>
        <div class="cta rv">
          <a class="btn solid" routerLink="/auth/register">{{ 'landing.ctaStart' | transloco }}
            <span class="material-icons">arrow_forward</span></a>
          <a class="btn glass" routerLink="/" fragment="how">{{ 'landing.ctaHow' | transloco }}</a>
        </div>
       <!-- <div class="proof rv">
          <div class="pf"><span class="pf-icon material-icons">rocket_launch</span><span>{{ 'landing.proofFree' | transloco }}</span></div><i></i>
          <div class="pf"><span class="pf-icon material-icons">public</span><span>{{ 'landing.proofCdn' | transloco }}</span></div><i></i>
          <div class="pf"><span class="pf-icon material-icons">credit_card_off</span><span>{{ 'landing.proofNoCard' | transloco }}</span></div>
        </div>-->
      </div>

      <div class="stage rv" dir="ltr">
        <div class="halo"></div>
        <div class="cert" [style.transform]="certTransform()">
          <div class="cert-in">
            <div class="c-top">
              <span class="c-mark"><span class="material-icons">workspace_premium</span></span>
              <span class="c-kind">{{ 'landing.certKind' | transloco }}</span>
              <span class="c-id">№ CF-2481-9M</span>
            </div>
            <div class="c-presented">{{ 'landing.certPresented' | transloco }}</div>
            <div class="c-name">{{ 'landing.certName' | transloco }}</div>
            <div class="c-rule"><i></i><span class="material-icons">verified</span><i></i></div>
            <div class="c-course">{{ 'landing.certCourse' | transloco }}</div>
            <div class="c-date">{{ 'landing.certDate' | transloco }}</div>
            <div class="c-foot">
              <div class="c-sig"><svg viewBox="0 0 120 34" aria-hidden="true"><path d="M6 26 C 20 4, 30 30, 44 14 S 70 4, 78 20 S 104 30, 114 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>{{ 'landing.certRole' | transloco }}</span></div>
              <div class="c-seal"><div class="seal"><span class="material-icons">military_tech</span></div></div>
              <div class="c-qr"><svg viewBox="0 0 21 21" aria-hidden="true" shape-rendering="crispEdges">
                <rect width="21" height="21" fill="transparent"/>
                <path fill="currentColor" d="M0 0h7v7H0zM2 2h3v3H2zM14 0h7v7h-7zM16 2h3v3h-3zM0 14h7v7H0zM2 16h3v3H2zM9 0h1v2H9zM11 1h2v1h-2zM9 3h2v1H9zM12 3h1v3h-1zM9 5h1v2H9zM10 6h2v1h-2zM0 9h2v1H0zM3 9h1v2H3zM5 9h2v1H5zM1 11h2v1H1zM4 11h1v1H4zM6 11h1v2H6zM0 12h1v1H0zM2 12h1v1H2zM9 9h3v3H9zM13 10h1v2h-1zM14 9h2v1h-2zM17 9h1v1h-1zM19 9h2v2h-2zM15 11h2v2h-2zM18 12h1v2h-1zM20 12h1v1h-1zM9 13h1v2H9zM11 13h1v1h-1zM10 15h3v1h-3zM14 14h1v3h-1zM9 17h1v4H9zM11 17h2v2h-2zM14 18h3v1h-3zM11 20h1v1h-1zM13 20h2v1h-2zM16 15h1v2h-1zM16 18h1v3h-1zM18 16h3v1h-3zM18 18h1v1h-1zM20 15h1v1h-1zM18 20h3v1h-3z"/>
              </svg></div>
            </div>
            <div class="stamp"><span class="material-icons">verified</span> {{ 'landing.certVerified' | transloco }}</div>
            <div class="foil"></div>
          </div>
        </div>
        <div class="chip ch1" ngNonBindable><span class="material-icons">data_object</span>{{recipient.name}}</div>
        <div class="chip ch2"><span class="material-icons">qr_code_2</span>{{ 'landing.chipQr' | transloco }}</div>
        <div class="chip ch3"><span class="material-icons">draw</span>{{ 'landing.chipSig' | transloco }}</div>
      </div>
    </div>

    <div class="ticker" aria-hidden="true">
      <div class="tk">
        @for (t of tickerKeys; track $index) { <span class="ti"><span class="material-icons">task_alt</span>{{ ('landing.'+t) | transloco }}</span> }
        @for (t of tickerKeys; track $index) { <span class="ti"><span class="material-icons">task_alt</span>{{ ('landing.'+t) | transloco }}</span> }
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ SEGMENTS ═══════════════════════ -->
  <section class="segs">
    <p class="segs-t rv">{{ 'landing.segTitle' | transloco }}</p>
    <div class="seg-row rv">
      <span><span class="material-icons">account_balance</span>{{ 'landing.segGov' | transloco }}</span>
      <span><span class="material-icons">school</span>{{ 'landing.segUni' | transloco }}</span>
      <span><span class="material-icons">auto_stories</span>{{ 'landing.segSchools' | transloco }}</span>
      <span><span class="material-icons">menu_book</span>{{ 'landing.segTraining' | transloco }}</span>
      <span><span class="material-icons">medical_services</span>{{ 'landing.segHealth' | transloco }}</span>
      <span><span class="material-icons">workspace_premium</span>{{ 'landing.segCert' | transloco }}</span>
      <span><span class="material-icons">corporate_fare</span>{{ 'landing.segEnt' | transloco }}</span>
    </div>
  </section>

  <!-- ═══════════════════ WORKFLOW ("how it works") ═══════════════════ -->
  <section id="how" class="sec wf-sec">
    <div class="sec-head rv">
      <span class="eyebrow">{{ 'landing.wf.eyebrow' | transloco }}</span>
      <h2>{{ 'landing.wf.title' | transloco }} <em>{{ 'landing.wf.titleEm' | transloco }}</em></h2>
      <p>{{ 'landing.wf.sub' | transloco }}</p>
    </div>

    <div class="wf rv" (mouseenter)="pause()" (mouseleave)="resume()">
      <!-- stage rail -->
      <div class="rail">
        @for (s of steps; track s.key; let i = $index) {
          <button class="stage-btn" [class.on]="active() === i" [class.done]="active() > i" (click)="go(i)">
            <span class="sb-ic"><span class="material-icons">{{ s.icon }}</span></span>
            <span class="sb-tx">
              <span class="sb-n">{{ s.n }}</span>
              <span class="sb-t">{{ ('landing.wf.'+s.key+'.title') | transloco }}</span>
              <span class="sb-r">{{ ('landing.wf.'+s.key+'.role') | transloco }}</span>
            </span>
            @if (active() === i) { <span class="sb-bar"><i [style.animation-play-state]="playing() ? 'running' : 'paused'"></i></span> }
          </button>
        }
        <div class="rail-foot">
          <button class="pp" (click)="togglePlay()" [attr.aria-label]="playing() ? 'Pause' : 'Play'">
            <span class="material-icons">{{ playing() ? 'pause' : 'play_arrow' }}</span>
            {{ (playing() ? 'landing.wf.playing' : 'landing.wf.paused') | transloco }}
          </button>
        </div>
      </div>

      <!-- detail panel -->
      <div class="panel">
        @for (s of steps; track s.key; let i = $index) {
          @if (active() === i) {
            <div class="pane" [attr.key]="s.key">
              <div class="pane-vis" dir="ltr" aria-hidden="true">
                <!-- scene 1: designer -->
                @if (i === 0) {
                  <div class="sc sc-design">
                    <div class="dz">
                      <div class="dz-el e1" ngNonBindable>Certificate of {{type}}</div>
                      <div class="dz-el e2" ngNonBindable>{{recipient.name}}</div>
                      <div class="dz-el e3"></div>
                      <div class="dz-seal"></div><div class="dz-qr"></div>
                      <div class="dz-cur"><span class="material-icons">near_me</span></div>
                    </div>
                    <div class="dz-tools"><span class="material-icons">title</span><span class="material-icons">image</span><span class="material-icons">qr_code_2</span><span class="material-icons">draw</span><span class="material-icons">table_chart</span></div>
                  </div>
                }
                <!-- scene 2: issue -->
                @if (i === 1) {
                  <div class="sc sc-issue">
                    <div class="xl">
                      <div class="xl-h"><span></span><span></span><span></span></div>
                      @for (r of [0,1,2,3,4]; track r) { <div class="xl-r" [style.--i]="r"><i></i><i></i><i></i><b class="material-icons">check_circle</b></div> }
                    </div>
                    <div class="xl-count"><span class="material-icons">bolt</span><b>1,240</b> issued</div>
                  </div>
                }
                <!-- scene 3: approve & sign -->
                @if (i === 2) {
                  <div class="sc sc-approve">
                    <div class="ap-card">
                      <div class="ap-row"><span class="ap-av">A</span><div class="ap-l"></div><span class="ap-badge pend">pending</span></div>
                      <div class="ap-row"><span class="ap-av b">M</span><div class="ap-l"></div><span class="ap-badge ok">approved</span></div>
                      <div class="ap-sig"><svg viewBox="0 0 140 40"><path d="M6 30 C 24 6, 36 34, 52 16 S 84 6, 96 24 S 128 34, 136 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></div>
                      <div class="ap-stamp"><span class="material-icons">verified</span></div>
                    </div>
                  </div>
                }
                <!-- scene 4: deliver -->
                @if (i === 3) {
                  <div class="sc sc-deliver">
                    <div class="dl-hub"><span class="material-icons">hub</span></div>
                    <span class="dl-ch c1"><span class="material-icons">mail</span>Email</span>
                    <span class="dl-ch c2"><span class="material-icons">sms</span>SMS</span>
                    <span class="dl-ch c3"><span class="material-icons">chat</span>WhatsApp</span>
                    <span class="dl-portal"><span class="material-icons">account_circle</span>Portal</span>
                  </div>
                }
                <!-- scene 5: verify -->
                @if (i === 4) {
                  <div class="sc sc-verify">
                    <div class="vf-shield"><span class="material-icons">shield</span><span class="vf-ck material-icons">check</span></div>
                    <div class="vf-scan"></div>
                    <div class="vf-tag"><span class="material-icons">verified</span> Authentic</div>
                  </div>
                }
              </div>

              <div class="pane-body">
                <span class="role"><span class="material-icons">badge</span>{{ 'landing.wf.roleLabel' | transloco }}: {{ ('landing.wf.'+s.key+'.role') | transloco }}</span>
                <h3>{{ ('landing.wf.'+s.key+'.title') | transloco }}</h3>
                <p>{{ ('landing.wf.'+s.key+'.desc') | transloco }}</p>
                <div class="does">{{ 'landing.wf.doesLabel' | transloco }}</div>
                <ul class="funcs">
                  @for (f of s.funcs; track f) {
                    <li><span class="material-icons">check</span>{{ ('landing.wf.'+s.key+'.'+f) | transloco }}</li>
                  }
                </ul>
                <div class="does">{{ 'landing.wf.propsLabel' | transloco }}</div>
                <div class="props">
                  @for (pr of s.props; track pr) {
                    <span class="prop" [attr.data-mono]="pr === 'p1' && s.key === 's1' ? '1' : null">{{ ('landing.wf.'+s.key+'.'+pr) | transloco }}</span>
                  }
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ FEATURES / CAPABILITIES ═══════════════════════ -->
  <section id="features" class="sec">
    <div class="sec-head rv">
      <span class="eyebrow">{{ 'landing.capsEyebrow' | transloco }}</span>
      <h2>{{ 'landing.capsTitle' | transloco }} <em>{{ 'landing.capsTitleEm' | transloco }}</em></h2>
      <p>{{ 'landing.capsSub' | transloco }}</p>
    </div>

    <div class="bento">
      <article class="bx big rv">
        <div class="bx-vis vis-designer" dir="ltr" aria-hidden="true">
          <div class="d-canvas">
            <div class="d-el d-t" ngNonBindable>Certificate of {{type}}</div>
            <div class="d-el d-n" ngNonBindable>{{recipient.name}}</div>
            <div class="d-el d-q"></div><div class="d-el d-s"></div>
            <div class="d-cursor"><span class="material-icons">near_me</span></div>
          </div>
          <div class="d-side"><span class="material-icons">title</span><span class="material-icons">image</span><span class="material-icons">qr_code_2</span><span class="material-icons">draw</span><span class="material-icons">table_chart</span></div>
        </div>
        <h3>{{ 'landing.f1T' | transloco }}</h3><p>{{ 'landing.f1B' | transloco }}</p>
      </article>

      <article class="bx rv">
        <div class="bx-vis vis-bulk" dir="ltr" aria-hidden="true">
          <div class="b-row" style="--i:0"><span class="material-icons">description</span><i></i><b>✓</b></div>
          <div class="b-row" style="--i:1"><span class="material-icons">description</span><i></i><b>✓</b></div>
          <div class="b-row" style="--i:2"><span class="material-icons">description</span><i></i><b>✓</b></div>
        </div>
        <h3>{{ 'landing.f2T' | transloco }}</h3><p>{{ 'landing.f2B' | transloco }}</p>
      </article>

      <article class="bx rv">
        <div class="bx-vis vis-send" aria-hidden="true">
          <span class="snd s1"><span class="material-icons">mail</span>Email</span>
          <span class="snd s2"><span class="material-icons">sms</span>SMS</span>
          <span class="snd s3"><span class="material-icons">chat</span>WhatsApp</span>
        </div>
        <h3>{{ 'landing.f3T' | transloco }}</h3><p>{{ 'landing.f3B' | transloco }}</p>
      </article>

      <article class="bx rv">
        <div class="bx-vis vis-verify" aria-hidden="true">
          <div class="v-shield"><span class="material-icons">shield</span><span class="v-check material-icons">check</span></div>
          <div class="v-scan"></div>
        </div>
        <h3>{{ 'landing.f4T' | transloco }}</h3><p>{{ 'landing.f4B' | transloco }}</p>
      </article>

      <article class="bx rv">
        <div class="bx-vis vis-flow" dir="ltr" aria-hidden="true">
          <span class="fl-n n1"><span class="material-icons">edit</span></span><i class="fl-l"></i>
          <span class="fl-n n2"><span class="material-icons">how_to_reg</span></span><i class="fl-l"></i>
          <span class="fl-n n3"><span class="material-icons">send</span></span>
        </div>
        <h3>{{ 'landing.f5T' | transloco }}</h3><p>{{ 'landing.f5B' | transloco }}</p>
      </article>

      <article class="bx wide rv">
        <div class="bx-2col">
          <div><h3>{{ 'landing.f6T' | transloco }}</h3><p>{{ 'landing.f6B' | transloco }}</p></div>
          <div class="bx-vis vis-code" dir="ltr" aria-hidden="true">
            <pre><code><span class="cm">// Issue via API</span>
<span class="kw">POST</span> /api/credentials
&#123; <span class="st">"template"</span>: <span class="st">"tpl_9x2"</span>,
  <span class="st">"recipient"</span>: <span class="st">"sarah&#64;org.ae"</span> &#125;
<span class="ok">→ 201 · issued in 240ms</span></code></pre>
          </div>
        </div>
      </article>
    </div>

    <!-- comprehensive capability chips -->
    <div class="caps rv">
      <div class="caps-h">{{ 'landing.capsMore' | transloco }}</div>
      <div class="caps-grid">
        @for (c of capIcons; track c.k) {
          <span class="cap"><span class="material-icons">{{ c.i }}</span>{{ ('landing.'+c.k) | transloco }}</span>
        }
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ SECURITY ═══════════════════════ -->
  <section class="sec dark-band">
    <div class="band-in">
      <div class="band-copy rv">
        <span class="eyebrow gold">{{ 'landing.secEyebrow' | transloco }}</span>
        <h2>{{ 'landing.secTitle' | transloco }} <em>{{ 'landing.secTitleEm' | transloco }}</em></h2>
        <p>{{ 'landing.secSub' | transloco }}</p>
        <ul class="band-list">
          <li><span class="material-icons">history_edu</span>{{ 'landing.sec1' | transloco }}</li>
          <li><span class="material-icons">gpp_maybe</span>{{ 'landing.sec2' | transloco }}</li>
          <li><span class="material-icons">admin_panel_settings</span>{{ 'landing.sec3' | transloco }}</li>
          <li><span class="material-icons">domain</span>{{ 'landing.sec4' | transloco }}</li>
        </ul>
      </div>
      <div class="band-vis rv" dir="ltr" aria-hidden="true">
        <div class="log">
          <div class="lg-r"><span class="material-icons ok2">check_circle</span><div><b>credential.issued</b><span>tpl_9x2 → s.almansouri — 14:02:11</span></div></div>
          <div class="lg-r"><span class="material-icons in2">visibility</span><div><b>credential.verified</b><span>public portal · Riyadh — 14:02:36</span></div></div>
          <div class="lg-r"><span class="material-icons wr2">gpp_maybe</span><div><b>credential.revoked</b><span>policy #7 · by admin — 14:05:52</span></div></div>
          <div class="lg-r"><span class="material-icons ok2">check_circle</span><div><b>batch.completed</b><span>1,240 issued · 0 failed — 14:09:18</span></div></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ PROMISE ═══════════════════════ -->
  <section class="sec promise-sec">
    <div class="promise-wrap rv">
      <span class="eyebrow" style="margin-bottom:20px">{{ 'landing.promiseEyebrow' | transloco }}</span>
      <h2 class="promise-h">{{ 'landing.promiseTitle' | transloco }} <em>{{ 'landing.promiseTitleEm' | transloco }}</em></h2>
      <p class="promise-sub">{{ 'landing.promiseSub' | transloco }}</p>
      <div class="promise-grid">
        <div class="pg-item">
          <span class="pg-ic material-icons">bolt</span>
          <b>{{ 'landing.p1Title' | transloco }}</b>
          <span>{{ 'landing.p1Body' | transloco }}</span>
        </div>
        <div class="pg-item">
          <span class="pg-ic material-icons">support_agent</span>
          <b>{{ 'landing.p2Title' | transloco }}</b>
          <span>{{ 'landing.p2Body' | transloco }}</span>
        </div>
        <div class="pg-item">
          <span class="pg-ic material-icons">lock</span>
          <b>{{ 'landing.p3Title' | transloco }}</b>
          <span>{{ 'landing.p3Body' | transloco }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════ PRICING ═══════════════════════ -->
  <section id="pricing" class="sec">
    <div class="sec-head rv">
      <span class="eyebrow">{{ 'landing.prEyebrow' | transloco }}</span>
      <h2>{{ 'landing.prTitle' | transloco }} <em>{{ 'landing.prTitleEm' | transloco }}</em></h2>
      <p>{{ 'landing.prSub' | transloco }}</p>
    </div>
    <!-- Cards render from the same DB catalogue as the Pricing page (api/Plan/GetPricingPlans). -->
    <div class="plans">
      @for (t of plan.catalog(); track t.id) {
        <div class="plan rv" [class.hot]="t.popular">
          @if (t.popular) { <span class="hot-b">{{ 'landing.planPopular' | transloco }}</span> }
          <h3>{{ planName(t) }}</h3>
          <div class="pr">
            @if (t.monthly === 0) {
              <b>{{ 'pricingPage.free' | transloco }}</b>
            } @else {
              <b>\${{ t.monthly }}</b><span>{{ 'landing.perMonth' | transloco }}</span>
            }
          </div>
          <p class="pd">{{ planBlurb(t) }}</p>
          <ul>
            @for (f of topFeatures(t); track f.label) { <li>{{ featText(f) }}</li> }
          </ul>
          @if (t.trial) {
            <a class="btn line" routerLink="/auth/register" [queryParams]="{ plan: t.id, interval: 'monthly' }">{{ 'landing.planStart' | transloco }}</a>
          } @else if (t.id === 'Enterprise') {
            <a class="btn line" routerLink="/" fragment="contact">{{ 'landing.planTalk' | transloco }}</a>
          } @else {
            <a class="btn" [class.solid]="t.popular" [class.line]="!t.popular" routerLink="/auth/register" [queryParams]="{ plan: t.id, interval: 'monthly' }">{{ 'pricingPage.subscribe' | transloco }}</a>
          }
        </div>
      }
    </div>
    <p class="pr-more rv"><a routerLink="/pricing">{{ 'landing.prAll' | transloco }} <span class="material-icons">arrow_forward</span></a></p>
  </section>

  <!-- ═══════════════════════ FAQ ═══════════════════════ -->
  <section id="faq" class="sec faq-sec">
    <div class="sec-head rv">
      <span class="eyebrow">{{ 'landing.faqEyebrow' | transloco }}</span>
      <h2>{{ 'landing.faqTitle' | transloco }}</h2>
    </div>
    <div class="faqs rv">
      <details><summary>{{ 'landing.q1' | transloco }}<span class="material-icons">expand_more</span></summary><p>{{ 'landing.a1' | transloco }}</p></details>
      <details><summary>{{ 'landing.q2' | transloco }}<span class="material-icons">expand_more</span></summary><p>{{ 'landing.a2' | transloco }}</p></details>
      <details><summary>{{ 'landing.q3' | transloco }}<span class="material-icons">expand_more</span></summary><p>{{ 'landing.a3' | transloco }}</p></details>
      <details><summary>{{ 'landing.q4' | transloco }}<span class="material-icons">expand_more</span></summary><p>{{ 'landing.a4' | transloco }}</p></details>
    </div>
  </section>

  <!-- ═══════════════════════ FINAL CTA ═══════════════════════ -->
  <section id="contact" class="sec cta-sec">
    <div class="cta-box rv">
      <div class="aurora a1"></div><div class="aurora a2"></div><div class="dots"></div>
      <h2>{{ 'landing.ctaTitle' | transloco }} <em>{{ 'landing.ctaTitleEm' | transloco }}</em></h2>
      <p>{{ 'landing.ctaSub' | transloco }}</p>
      <div class="cta">
        <a class="btn solid" routerLink="/auth/register">{{ 'landing.ctaStart' | transloco }} <span class="material-icons">arrow_forward</span></a>
        <a class="btn glass" href="mailto:hello@certifada.com">hello&#64;certifada.com</a>
      </div>
      <a class="cta-phone" href="tel:+971502272170">
        <span class="cp-pulse"></span>
        <span class="material-icons">phone_in_talk</span>
        <span class="cp-text">{{ 'landing.ctaPhone' | transloco }}<b dir="ltr">+971 50 227 2170</b></span>
      </a>
    </div>
  </section>
  `,
  styles: [`
  :host{display:block;color:var(--cf-ink-700);overflow-x:clip}
  em{font-family:"Playfair Display",Georgia,serif;font-style:italic;font-weight:600}
  :host-context([dir=rtl]) em{font-family:"Amiri","Playfair Display",serif}
  .eyebrow{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--cf-brand-600);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);padding:6px 14px;border-radius:999px}
  :host-context([dir=rtl]) .eyebrow{letter-spacing:0}
  .eyebrow.gold{color:#E2B45A;background:rgba(226,180,90,.1);border-color:rgba(226,180,90,.25)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:14.5px;padding:14px 26px;border-radius:14px;text-decoration:none;transition:transform .18s,box-shadow .22s,background .18s,border-color .18s;border:1px solid transparent;cursor:pointer}
  .btn .material-icons{font-size:18px;transition:transform .25s cubic-bezier(.2,1.4,.4,1)}
  .btn:hover .material-icons{transform:translateX(3px)}
  :host-context([dir=rtl]) .btn .material-icons{transform:scaleX(-1)}
  :host-context([dir=rtl]) .btn:hover .material-icons{transform:translateX(-3px) scaleX(-1)}
  .btn.solid{background:linear-gradient(135deg,#6366F1,#4338CA 55%,#7C3AED);color:#fff;box-shadow:0 12px 32px -12px rgba(79,70,229,.65),inset 0 1px 0 rgba(255,255,255,.2)}
  .btn.solid:hover{transform:translateY(-2px);box-shadow:0 20px 44px -14px rgba(79,70,229,.75),inset 0 1px 0 rgba(255,255,255,.25)}
  .btn.glass{background:rgba(255,255,255,.07);color:#EDF0FF;border-color:rgba(255,255,255,.18);backdrop-filter:blur(8px)}
  .btn.glass:hover{background:rgba(255,255,255,.13);transform:translateY(-2px)}
  .btn.line{background:var(--cf-surface);color:var(--cf-ink-900);border-color:var(--cf-line)}
  .btn.line:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600);transform:translateY(-2px)}
  .rv{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.65,.3,1),transform .7s cubic-bezier(.2,.65,.3,1);transition-delay:var(--d,0s)}
  .rv.in{opacity:1;transform:none}

  /* hero */
  .hero{position:relative;background:#070B17;color:#EDF0FF;padding:104px 28px 0;overflow:hidden;isolation:isolate;height:100dvh;display:flex;flex-direction:column}
  .aurora{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;z-index:-1;pointer-events:none}
  .a1{width:640px;height:520px;top:-220px;inset-inline-start:-140px;background:radial-gradient(circle,#4338CA 0%,transparent 65%);animation:drift 16s ease-in-out infinite alternate}
  .a2{width:560px;height:560px;top:-120px;inset-inline-end:-160px;background:radial-gradient(circle,#0EA5E9 0%,transparent 62%);opacity:.32;animation:drift 20s ease-in-out infinite alternate-reverse}
  .a3{width:460px;height:420px;bottom:-180px;inset-inline-start:32%;background:radial-gradient(circle,#7C3AED 0%,transparent 62%);opacity:.3;animation:drift 24s ease-in-out infinite alternate}
  @keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(46px,30px) scale(1.12)}}
  .dots{position:absolute;inset:0;z-index:-1;background-image:radial-gradient(rgba(255,255,255,.13) 1px,transparent 1px);background-size:26px 26px;mask-image:radial-gradient(ellipse 85% 70% at 50% 30%,#000 30%,transparent 75%)}
  .hero-grid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.04fr .96fr;gap:44px;align-items:center;padding-bottom:40px;flex:1;min-height:0;width:100%}
  .pill{display:inline-flex;align-items:center;gap:9px;font-size:12.5px;font-weight:600;color:#C7D2FE;background:rgba(99,102,241,.14);border:1px solid rgba(129,140,248,.3);padding:7px 15px;border-radius:999px}
  .pulse{width:7px;height:7px;border-radius:50%;background:#34D399;box-shadow:0 0 0 0 rgba(52,211,153,.55);animation:pulse 2.2s infinite}
  @keyframes pulse{70%{box-shadow:0 0 0 9px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}
  .hero h1{font-size:clamp(38px,5.2vw,64px);line-height:1.06;letter-spacing:-.03em;color:#fff;font-weight:700;margin:22px 0 0}
  :host-context([dir=rtl]) .hero h1{letter-spacing:0;line-height:1.2}
  .hero h1 em{background:linear-gradient(100deg,#E2B45A,#F5DFA8 55%,#E2B45A);-webkit-background-clip:text;background-clip:text;color:transparent}
  .hero .lead{font-size:17.5px;line-height:1.65;color:#A9B4D6;max-width:52ch;margin-top:20px}
  .cta{display:flex;gap:14px;margin-top:32px;flex-wrap:wrap}
  .proof{display:flex;align-items:center;gap:22px;margin-top:42px;flex-wrap:wrap}
  .proof i{width:1px;height:30px;background:rgba(255,255,255,.14)}
  .pf b{display:block;font-size:21px;font-weight:700;color:#fff;letter-spacing:-.02em}
  .pf span{font-size:12px;color:#8A97B8}
  .pf-icon{display:block;font-size:22px;color:#818CF8;margin-bottom:2px}
  .stage{position:relative;width:100%;perspective:1400px;display:grid;place-items:center;padding:24px 8px}
  .halo{position:absolute;width:78%;height:82%;border-radius:28px;background:conic-gradient(from 210deg,#4338CA,#0EA5E9,#7C3AED,#E2B45A,#4338CA);filter:blur(46px);opacity:.4;animation:spin 14s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .cert{position:relative;width:min(470px,100%);aspect-ratio:10/7;transition:transform .18s ease-out;transform-style:preserve-3d;animation:float 7s ease-in-out infinite}
  @keyframes float{0%,100%{translate:0 0}50%{translate:0 -10px}}
  .cert-in{position:absolute;inset:0;background:linear-gradient(165deg,#FDFDFB,#F4F2EC);border-radius:18px;box-shadow:0 44px 90px -32px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.55) inset;padding:26px 30px;display:flex;flex-direction:column;color:#2A3040;overflow:hidden}
  .cert-in::before{content:"";position:absolute;inset:9px;border:1.5px solid rgba(180,148,72,.5);border-radius:12px;pointer-events:none}
  .cert-in::after{content:"";position:absolute;inset:13px;border:1px solid rgba(180,148,72,.28);border-radius:9px;pointer-events:none}
  .c-top{display:flex;align-items:center;gap:9px;font-size:9px;letter-spacing:.22em;font-weight:700;color:#8B6F35}
  .c-mark{width:24px;height:24px;border-radius:7px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;display:grid;place-items:center;flex:none}
  .c-mark .material-icons{font-size:15px}
  .c-id{margin-inline-start:auto;letter-spacing:.08em;color:#A9A090}
  .c-presented{font-size:10.5px;color:#8D93A5;margin-top:20px;text-align:center;letter-spacing:.06em}
  .c-name{font-family:"Playfair Display",Georgia,serif;font-size:clamp(23px,3.4vw,31px);font-weight:600;color:#141A2B;text-align:center;margin-top:5px}
  .c-rule{display:flex;align-items:center;gap:9px;margin:9px 12% 0;color:#C7A75C}
  .c-rule i{flex:1;height:1px;background:linear-gradient(90deg,transparent,#C7A75C,transparent)}
  .c-rule .material-icons{font-size:14px}
  .c-course{font-size:12.5px;font-weight:600;color:#39415A;text-align:center;margin-top:9px}
  .c-date{font-size:10px;color:#9AA0B2;text-align:center;margin-top:4px}
  .c-foot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
  .c-sig{display:flex;flex-direction:column;align-items:center;gap:2px;color:#39415A}
  .c-sig svg{width:88px;height:26px;color:#2A3040}
  .c-sig span{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:#9AA0B2;border-top:1px solid #D8D4C8;padding-top:3px}
  .seal{width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#F1D48A,#D9A441 58%,#B98A2E);display:grid;place-items:center;color:#7A5A14;box-shadow:0 6px 16px -6px rgba(185,138,46,.75),inset 0 1px 2px rgba(255,255,255,.6);position:relative}
  .seal::before{content:"";position:absolute;inset:5px;border-radius:50%;border:1px dashed rgba(122,90,20,.5)}
  .seal .material-icons{font-size:24px}
  .c-qr{width:52px;height:52px;padding:5px;background:#fff;border:1px solid #E3DFD3;border-radius:8px;color:#1A2032}
  .c-qr svg{width:100%;height:100%}
  .stamp{position:absolute;top:16px;inset-inline-end:-8px;display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#10B981,#059669);color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.12em;padding:7px 14px;border-radius:8px;box-shadow:0 10px 22px -8px rgba(5,150,105,.7);transform:rotate(6deg);animation:stampin .7s cubic-bezier(.2,1.6,.4,1) .9s both}
  .stamp .material-icons{font-size:14px}
  @keyframes stampin{from{transform:rotate(6deg) scale(2.4);opacity:0}to{transform:rotate(6deg) scale(1);opacity:1}}
  .foil{position:absolute;inset:0;background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.5) 50%,transparent 58%);mix-blend-mode:soft-light;animation:foil 5.5s ease-in-out infinite;pointer-events:none}
  @keyframes foil{0%,60%,100%{transform:translateX(-110%)}30%{transform:translateX(110%)}}
  .chip{position:absolute;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;font-family:ui-monospace,Menlo,monospace;color:#DDE3FF;background:rgba(20,26,48,.85);border:1px solid rgba(129,140,248,.4);padding:7px 12px;border-radius:10px;backdrop-filter:blur(6px);box-shadow:0 12px 28px -12px rgba(0,0,0,.6)}
  .chip .material-icons{font-size:14px;color:#818CF8}
  .ch1{top:6%;inset-inline-start:-2%;animation:chip 6s ease-in-out infinite}
  .ch2{bottom:14%;inset-inline-end:-3%;animation:chip 7s ease-in-out 1.2s infinite}
  .ch3{bottom:-2%;inset-inline-start:12%;animation:chip 8s ease-in-out .6s infinite}
  @keyframes chip{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
  .ticker{position:relative;flex-shrink:0;border-top:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
  .tk{display:flex;gap:44px;width:max-content;padding:13px 0;animation:tick 36s linear infinite}
  .ticker:hover .tk{animation-play-state:paused}
  @keyframes tick{to{transform:translateX(-50%)}}
  :host-context([dir=rtl]) .tk{animation-name:tick-rtl}
  @keyframes tick-rtl{to{transform:translateX(50%)}}
  .ti{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:#8A97B8;white-space:nowrap}
  .ti .material-icons{font-size:15px;color:#34D399}

  /* segments */
  .segs{padding:54px 28px 10px;text-align:center}
  .segs-t{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--cf-ink-400)}
  :host-context([dir=rtl]) .segs-t{letter-spacing:0}
  .seg-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 34px;margin-top:20px}
  .seg-row span{display:inline-flex;align-items:center;gap:8px;font-size:14.5px;font-weight:600;color:var(--cf-ink-500);opacity:.85;transition:.2s}
  .seg-row span:hover{color:var(--cf-brand-600);opacity:1}
  .seg-row .material-icons{font-size:19px}

  /* sections */
  .sec{max-width:1180px;margin:0 auto;padding:96px 28px}
  .sec-head{text-align:center;max-width:680px;margin:0 auto 54px}
  .sec-head h2{font-size:clamp(28px,3.6vw,42px);letter-spacing:-.025em;color:var(--cf-ink-900);margin-top:16px;line-height:1.14}
  :host-context([dir=rtl]) .sec-head h2{letter-spacing:0;line-height:1.3}
  .sec-head h2 em{color:var(--cf-brand-600)}
  .sec-head p{color:var(--cf-ink-500);font-size:16px;margin-top:14px;line-height:1.65}

  /* ── WORKFLOW ── */
  .wf-sec{padding-bottom:40px}
  .wf{display:grid;grid-template-columns:340px 1fr;gap:22px;align-items:stretch}
  .rail{display:flex;flex-direction:column;gap:8px}
  .stage-btn{position:relative;display:flex;align-items:flex-start;gap:13px;text-align:start;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:16px;padding:15px 16px;cursor:pointer;font:inherit;transition:border-color .2s,box-shadow .2s,background .2s;overflow:hidden}
  .stage-btn:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line))}
  .stage-btn.on{border-color:transparent;box-shadow:0 0 0 2px var(--cf-brand-500),0 20px 40px -24px rgba(79,70,229,.5);background:linear-gradient(180deg,var(--cf-surface),color-mix(in srgb,var(--cf-brand-50) 55%,var(--cf-surface)))}
  .sb-ic{width:40px;height:40px;flex:none;border-radius:12px;display:grid;place-items:center;background:var(--cf-surface-2);border:1px solid var(--cf-line-soft);color:var(--cf-ink-400);transition:.2s}
  .stage-btn.on .sb-ic{background:linear-gradient(135deg,#6366F1,#4338CA);border-color:transparent;color:#fff;box-shadow:0 8px 18px -8px rgba(79,70,229,.7)}
  .stage-btn.done .sb-ic{background:color-mix(in srgb,#10B981 14%,var(--cf-surface-2));color:#10B981}
  .sb-ic .material-icons{font-size:20px}
  .sb-tx{display:flex;flex-direction:column;gap:2px;min-width:0}
  .sb-n{font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--cf-ink-400)}
  .stage-btn.on .sb-n{color:var(--cf-brand-600)}
  .sb-t{font-size:14.5px;font-weight:700;color:var(--cf-ink-900);line-height:1.25}
  .sb-r{font-size:11.5px;color:var(--cf-ink-500)}
  .sb-bar{position:absolute;inset-inline:0;bottom:0;height:3px;background:var(--cf-line-soft)}
  .sb-bar i{display:block;height:100%;width:100%;transform-origin:left;background:linear-gradient(90deg,#6366F1,#0EA5E9);animation:sbfill 6s linear forwards}
  :host-context([dir=rtl]) .sb-bar i{transform-origin:right}
  @keyframes sbfill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  .rail-foot{margin-top:4px}
  .pp{display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:12.5px;font-weight:600;color:var(--cf-ink-500);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:999px;padding:8px 14px;cursor:pointer;transition:.2s}
  .pp:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
  .pp .material-icons{font-size:16px}
  .panel{position:relative;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:22px;overflow:hidden;box-shadow:var(--cf-shadow-sm)}
  .pane{display:grid;grid-template-columns:1.05fr 1fr;height:100%;animation:paneIn .5s cubic-bezier(.2,.65,.3,1)}
  @keyframes paneIn{from{opacity:0}to{opacity:1}}
  .pane-vis{position:relative;background:radial-gradient(120% 120% at 20% 0%,color-mix(in srgb,var(--cf-brand-500) 12%,var(--cf-surface-2)),var(--cf-surface-2));border-inline-end:1px solid var(--cf-line);display:grid;place-items:center;min-height:320px;overflow:hidden}
  :host-context([dir=rtl]) .pane-vis{border-inline-end:0;border-inline-start:1px solid var(--cf-line)}
  .sc{position:relative;width:78%;max-width:320px}
  /* scene: design */
  .sc-design{display:flex;gap:10px}
  .dz{flex:1;aspect-ratio:4/3;background:var(--cf-surface);border:1px dashed color-mix(in srgb,var(--cf-brand-500) 45%,var(--cf-line));border-radius:12px;position:relative;box-shadow:var(--cf-shadow-sm)}
  .dz-el{position:absolute;left:50%;transform:translateX(-50%);font-size:10.5px;padding:4px 8px;border:1px solid var(--cf-brand-200);background:var(--cf-brand-50);border-radius:6px;color:var(--cf-ink-700);white-space:nowrap}
  .e1{top:14%;letter-spacing:.04em}
  .e2{top:36%;font-family:"Playfair Display",serif;font-size:14px;color:var(--cf-ink-900);background:transparent;border-color:transparent}
  .e3{top:56%;width:44%;height:6px;background:var(--cf-line);border:0;border-radius:99px}
  .dz-seal{position:absolute;bottom:10%;left:16%;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F1D48A,#D9A441);box-shadow:0 5px 12px -4px rgba(185,138,46,.7)}
  .dz-qr{position:absolute;bottom:10%;right:16%;width:30px;height:30px;border-radius:5px;background:repeating-conic-gradient(#20263A 0 25%,#fff 0 50%) 0 0/7.5px 7.5px;outline:1px solid var(--cf-line)}
  .dz-cur{position:absolute;top:34%;left:60%;color:var(--cf-brand-600);animation:dcur 5s ease-in-out infinite}
  .dz-cur .material-icons{font-size:18px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))}
  @keyframes dcur{0%,100%{transform:translate(0,0)}30%{transform:translate(-46px,22px)}60%{transform:translate(16px,36px)}}
  .dz-tools{width:40px;background:var(--cf-surface);border:1px solid var(--cf-line-soft);border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:11px;padding:11px 0;box-shadow:var(--cf-shadow-sm)}
  .dz-tools .material-icons{font-size:16px;color:var(--cf-ink-400)}
  .dz-tools .material-icons:first-child{color:var(--cf-brand-600);background:var(--cf-brand-50);border-radius:6px;padding:3px}
  /* scene: issue */
  .sc-issue{display:flex;flex-direction:column;gap:12px}
  .xl{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:12px;padding:12px;box-shadow:var(--cf-shadow-sm)}
  .xl-h{display:flex;gap:6px;margin-bottom:8px}
  .xl-h span{height:7px;border-radius:99px;background:var(--cf-brand-200);flex:1}
  .xl-r{display:flex;align-items:center;gap:6px;padding:5px 0}
  .xl-r i{height:6px;border-radius:99px;background:var(--cf-line-soft);flex:1;overflow:hidden;position:relative}
  .xl-r i::after{content:"";position:absolute;inset:0;border-radius:99px;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-accent-500));transform-origin:left;animation:fill 3.4s calc(var(--i)*.35s) ease-in-out infinite}
  :host-context([dir=rtl]) .xl-r i::after{transform-origin:right}
  @keyframes fill{0%{transform:scaleX(0)}45%,80%{transform:scaleX(1)}100%{transform:scaleX(1)}}
  .xl-r b{font-size:15px;color:#10B981;opacity:0;animation:pop 3.4s calc(var(--i)*.35s + 1.2s) ease infinite}
  @keyframes pop{8%,80%{opacity:1}0%,100%{opacity:0}}
  .xl-count{display:inline-flex;align-items:center;gap:7px;align-self:center;font-size:13px;font-weight:700;color:var(--cf-ink-900);background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:99px;padding:8px 14px;box-shadow:var(--cf-shadow-sm)}
  .xl-count .material-icons{font-size:16px;color:var(--cf-brand-600)}
  .xl-count b{color:var(--cf-brand-600)}
  /* scene: approve */
  .sc-approve{display:grid;place-items:center}
  .ap-card{position:relative;width:100%;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;padding:18px;box-shadow:var(--cf-shadow-md)}
  .ap-row{display:flex;align-items:center;gap:10px;padding:7px 0}
  .ap-av{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;color:#fff;background:#6366F1;flex:none}
  .ap-av.b{background:#0EA5E9}
  .ap-l{flex:1;height:6px;border-radius:99px;background:var(--cf-line-soft)}
  .ap-badge{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px}
  .ap-badge.pend{background:var(--cf-warning-soft);color:var(--cf-warning)}
  .ap-badge.ok{background:var(--cf-success-soft);color:var(--cf-success);animation:pop 4s 1s ease infinite}
  .ap-sig{margin-top:8px;color:var(--cf-brand-600)}
  .ap-sig svg{width:120px;height:34px;stroke-dasharray:260;stroke-dashoffset:260;animation:draw 4s ease-in-out infinite}
  @keyframes draw{0%{stroke-dashoffset:260}45%,100%{stroke-dashoffset:0}}
  .ap-stamp{position:absolute;top:-12px;inset-inline-end:-10px;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);color:#fff;display:grid;place-items:center;box-shadow:0 10px 22px -8px rgba(5,150,105,.8);animation:stampin2 4s 1.4s ease infinite}
  .ap-stamp .material-icons{font-size:21px}
  @keyframes stampin2{0%,100%{transform:scale(0);opacity:0}12%,80%{transform:scale(1);opacity:1}}
  /* scene: deliver */
  .sc-deliver{display:grid;place-items:center;min-height:200px}
  .dl-hub{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;box-shadow:0 14px 30px -12px rgba(79,70,229,.8);z-index:2}
  .dl-hub .material-icons{font-size:28px}
  .dl-ch{position:absolute;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface);border:1px solid var(--cf-line);padding:7px 11px;border-radius:99px;box-shadow:var(--cf-shadow-sm)}
  .dl-ch .material-icons{font-size:14px}
  .c1{top:6%;inset-inline-start:2%;animation:chip 5s ease-in-out infinite}.c1 .material-icons{color:#4F46E5}
  .c2{top:8%;inset-inline-end:2%;animation:chip 5s .7s ease-in-out infinite}.c2 .material-icons{color:#0EA5E9}
  .c3{bottom:20%;inset-inline-start:0;animation:chip 5s 1.4s ease-in-out infinite}.c3 .material-icons{color:#10B981}
  .dl-portal{position:absolute;bottom:6%;inset-inline-end:2%;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:#fff;background:linear-gradient(135deg,#0EA5E9,#0369A1);padding:7px 12px;border-radius:99px;box-shadow:0 10px 22px -10px rgba(3,105,161,.8);animation:chip 5s 2.1s ease-in-out infinite}
  .dl-portal .material-icons{font-size:14px}
  /* scene: verify */
  .sc-verify{display:grid;place-items:center;min-height:200px}
  .vf-shield{position:relative;color:var(--cf-brand-600)}
  .vf-shield>.material-icons{font-size:78px}
  .vf-ck{position:absolute;inset:0;display:grid;place-items:center;font-size:32px;color:#fff}
  .vf-scan{position:absolute;width:120px;height:120px;border-radius:14px;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--cf-accent-500) 24%,transparent),transparent);animation:scan 2.6s ease-in-out infinite}
  @keyframes scan{0%,100%{transform:translateY(-46px)}50%{transform:translateY(46px)}}
  .vf-tag{position:absolute;bottom:8%;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#059669;background:var(--cf-success-soft);border:1px solid color-mix(in srgb,#10B981 30%,transparent);padding:6px 13px;border-radius:99px;animation:pop 3.4s 1s ease infinite}
  .vf-tag .material-icons{font-size:15px}

  .pane-body{padding:26px 28px}
  .role{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);padding:6px 12px;border-radius:999px}
  .role .material-icons{font-size:15px}
  .pane-body h3{font-size:22px;color:var(--cf-ink-900);letter-spacing:-.02em;margin-top:14px}
  :host-context([dir=rtl]) .pane-body h3{letter-spacing:0}
  .pane-body>p{color:var(--cf-ink-500);font-size:14.5px;line-height:1.65;margin-top:9px}
  .does{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--cf-ink-400);margin:20px 0 11px}
  :host-context([dir=rtl]) .does{letter-spacing:0}
  .funcs{list-style:none;padding:0;margin:0;display:grid;gap:9px}
  .funcs li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:var(--cf-ink-700)}
  .funcs li .material-icons{font-size:13px;color:#fff;background:linear-gradient(135deg,#10B981,#059669);border-radius:6px;padding:2px;margin-top:1px;flex:none}
  .props{display:flex;flex-wrap:wrap;gap:8px}
  .prop{font-size:12px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface-2);border:1px solid var(--cf-line);padding:6px 11px;border-radius:8px}
  .prop[data-mono]{font-family:ui-monospace,Menlo,monospace;color:var(--cf-brand-700);background:var(--cf-brand-50);border-color:var(--cf-brand-100)}

  /* bento */
  .bento{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .bx{position:relative;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:22px;padding:24px;overflow:hidden;transition:transform .25s,box-shadow .3s,border-color .25s}
  .bx:hover{transform:translateY(-4px);box-shadow:0 30px 60px -28px rgba(15,23,42,.25);border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line))}
  .bx.big{grid-row:span 2}
  .bx.wide{grid-column:span 2}
  .bx h3{font-size:16.5px;color:var(--cf-ink-900);margin-top:18px}
  .bx p{font-size:13.5px;color:var(--cf-ink-500);line-height:1.6;margin-top:7px}
  .bx-vis{position:relative;border-radius:14px;background:var(--cf-surface-2);border:1px solid var(--cf-line-soft);overflow:hidden}
  .vis-designer{height:290px;display:flex}
  .d-canvas{flex:1;margin:16px;background:var(--cf-surface);border:1px dashed color-mix(in srgb,var(--cf-brand-500) 45%,var(--cf-line));border-radius:10px;position:relative}
  .d-el{position:absolute;font-size:11px;color:var(--cf-ink-600);border:1px solid var(--cf-brand-200);background:var(--cf-brand-50);border-radius:6px;padding:5px 9px}
  .d-t{top:14%;left:50%;transform:translateX(-50%);letter-spacing:.06em}
  .d-n{top:38%;left:50%;transform:translateX(-50%);font-family:"Playfair Display",serif;font-size:15px;color:var(--cf-ink-900);background:transparent;border-color:transparent}
  .d-q{width:34px;height:34px;bottom:12%;right:10%;background:repeating-conic-gradient(var(--cf-ink-400) 0 25%,transparent 0 50%) 0 0/8px 8px;opacity:.65;border-color:var(--cf-line)}
  .d-s{width:30px;height:30px;bottom:12%;left:10%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F1D48A,#D9A441);border-color:transparent}
  .d-cursor{position:absolute;top:36%;left:62%;color:var(--cf-brand-600);animation:cur 5s ease-in-out infinite}
  .d-cursor .material-icons{font-size:19px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))}
  @keyframes cur{0%,100%{transform:translate(0,0)}30%{transform:translate(-58px,26px)}60%{transform:translate(20px,44px)}}
  .d-side{width:44px;margin:16px 16px 16px 0;background:var(--cf-surface);border:1px solid var(--cf-line-soft);border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px 0}
  .d-side .material-icons{font-size:17px;color:var(--cf-ink-400)}
  .d-side .material-icons:first-child{color:var(--cf-brand-600);background:var(--cf-brand-50);border-radius:6px;padding:3px}
  .vis-bulk{height:120px;display:flex;flex-direction:column;justify-content:center;gap:9px;padding:14px}
  .b-row{display:flex;align-items:center;gap:9px}
  .b-row .material-icons{font-size:15px;color:var(--cf-ink-400)}
  .b-row i{flex:1;height:5px;border-radius:99px;background:var(--cf-line-soft);position:relative;overflow:hidden}
  .b-row i::after{content:"";position:absolute;inset:0;border-radius:99px;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-accent-500));transform-origin:left;animation:fill 3.2s calc(var(--i)*.45s) ease-in-out infinite}
  :host-context([dir=rtl]) .b-row i::after{transform-origin:right}
  .b-row b{font-size:11px;color:#10B981;opacity:0;animation:pop 3.2s calc(var(--i)*.45s + 1.3s) ease infinite}
  .vis-send{height:120px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:12px}
  .snd{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface);border:1px solid var(--cf-line);padding:8px 13px;border-radius:99px;box-shadow:var(--cf-shadow-sm)}
  .snd .material-icons{font-size:15px}
  .s1 .material-icons{color:#4F46E5}.s2 .material-icons{color:#0EA5E9}.s3 .material-icons{color:#10B981}
  .s1{animation:chip 5s ease-in-out infinite}.s2{animation:chip 5s .8s ease-in-out infinite}.s3{animation:chip 5s 1.6s ease-in-out infinite}
  .vis-verify{height:120px;display:grid;place-items:center;position:relative}
  .v-shield{position:relative;color:var(--cf-brand-600)}
  .v-shield>.material-icons{font-size:52px}
  .v-check{position:absolute;inset:0;display:grid;place-items:center;font-size:22px;color:#fff}
  .v-scan{position:absolute;inset:12px;border-radius:10px;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--cf-accent-500) 22%,transparent),transparent);animation:scan 2.6s ease-in-out infinite}
  .vis-flow{height:120px;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px}
  .fl-n{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--cf-surface);border:1px solid var(--cf-line);color:var(--cf-ink-500);box-shadow:var(--cf-shadow-sm)}
  .fl-n .material-icons{font-size:18px}
  .n1{color:var(--cf-brand-600)}.n2{color:#0EA5E9}.n3{color:#10B981}
  .fl-l{width:34px;height:2px;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-accent-500));border-radius:99px;position:relative}
  .fl-l::after{content:"";position:absolute;top:-2px;width:6px;height:6px;border-radius:50%;background:var(--cf-accent-500);animation:dot 2.4s linear infinite}
  @keyframes dot{from{left:-4px;opacity:0}15%{opacity:1}85%{opacity:1}to{left:100%;opacity:0}}
  .bx-2col{display:grid;grid-template-columns:1fr 1.1fr;gap:22px;align-items:center}
  .bx-2col h3{margin-top:0}
  .vis-code{padding:16px 18px;background:#0C1224;border-color:#1B2440}
  .vis-code pre{margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.75;color:#B6C2E2;white-space:pre-wrap}
  .vis-code .cm{color:#5B688C}.vis-code .kw{color:#818CF8;font-weight:700}.vis-code .st{color:#7DD3FC}.vis-code .ok{color:#34D399}

  /* capability chips */
  .caps{margin-top:26px}
  .caps-h{text-align:center;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--cf-ink-400);margin-bottom:18px}
  :host-context([dir=rtl]) .caps-h{letter-spacing:0}
  .caps-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
  .cap{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface);border:1px solid var(--cf-line);padding:9px 14px;border-radius:999px;transition:transform .18s,border-color .18s,color .18s}
  .cap:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));color:var(--cf-brand-600)}
  .cap .material-icons{font-size:16px;color:var(--cf-brand-500)}

  /* dark band */
  .dark-band{max-width:none;background:#070B17;color:#EDF0FF;padding:96px 28px;position:relative;overflow:hidden}
  .dark-band::before{content:"";position:absolute;inset:0;background:radial-gradient(700px 360px at 12% 0%,rgba(67,56,202,.4),transparent 60%),radial-gradient(600px 340px at 100% 100%,rgba(14,165,233,.22),transparent 55%)}
  .band-in{position:relative;max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
  .band-copy h2{color:#fff;font-size:clamp(26px,3.2vw,38px);letter-spacing:-.025em;margin-top:16px;line-height:1.15}
  :host-context([dir=rtl]) .band-copy h2{letter-spacing:0;line-height:1.3}
  .band-copy h2 em{color:#E2B45A}
  .band-copy>p{color:#A9B4D6;margin-top:14px;font-size:15.5px;line-height:1.65}
  .band-list{list-style:none;padding:0;margin:26px 0 0;display:grid;gap:13px}
  .band-list li{display:flex;align-items:center;gap:12px;font-size:14.5px;color:#C9D2EC}
  .band-list .material-icons{font-size:19px;color:#E2B45A;background:rgba(226,180,90,.12);border:1px solid rgba(226,180,90,.25);border-radius:9px;padding:6px}
  .band-vis .log{background:rgba(13,18,36,.85);border:1px solid rgba(129,140,248,.22);border-radius:18px;padding:18px;backdrop-filter:blur(8px);box-shadow:0 40px 80px -40px rgba(0,0,0,.8);display:grid;gap:10px}
  .lg-r{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:11px 14px;font-family:ui-monospace,Menlo,monospace}
  .lg-r b{display:block;font-size:12.5px;color:#DDE3FF;font-weight:600}
  .lg-r span:not(.material-icons){font-size:11px;color:#7683A8}
  .lg-r .material-icons{font-size:18px}
  .ok2{color:#34D399}.in2{color:#38BDF8}.wr2{color:#FBBF24}

  /* promise */
  .promise-sec{padding-top:80px;padding-bottom:80px;background:linear-gradient(180deg,var(--cf-surface) 0%,color-mix(in srgb,var(--cf-brand-50) 40%,var(--cf-surface)) 100%)}
  .promise-wrap{max-width:860px;margin:0 auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
  .promise-h{font-size:clamp(26px,3.2vw,38px);letter-spacing:-.025em;color:var(--cf-ink-900);line-height:1.16;margin:0}
  :host-context([dir=rtl]) .promise-h{letter-spacing:0;line-height:1.3}
  .promise-h em{color:var(--cf-brand-600)}
  .promise-sub{font-size:15.5px;color:var(--cf-ink-500);max-width:58ch;line-height:1.65;margin:4px 0 28px}
  .promise-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:100%;text-align:start}
  .pg-item{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:20px;padding:26px 22px;display:flex;flex-direction:column;gap:10px;transition:transform .25s,box-shadow .3s,border-color .25s}
  .pg-item:hover{transform:translateY(-4px);box-shadow:0 24px 48px -16px rgba(79,70,229,.14);border-color:var(--cf-brand-200)}
  .pg-ic{font-size:26px;width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;box-shadow:0 10px 22px -8px rgba(79,70,229,.55);flex:none}
  .pg-item b{font-size:15.5px;font-weight:700;color:var(--cf-ink-900);line-height:1.3}
  .pg-item span{font-size:13.5px;color:var(--cf-ink-500);line-height:1.6}
  @media(max-width:640px){.promise-grid{grid-template-columns:1fr}}

  /* pricing */
  .plans{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:stretch}
  .plan{position:relative;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:22px;padding:30px 26px;display:flex;flex-direction:column;transition:transform .22s,box-shadow .28s}
  .plan:hover{transform:translateY(-5px);box-shadow:0 30px 60px -28px rgba(15,23,42,.25)}
  .plan.hot{background:linear-gradient(180deg,#0B1020,#101A36);border-color:rgba(129,140,248,.4);color:#DDE3FF;box-shadow:0 34px 68px -30px rgba(31,41,110,.7)}
  .plan.hot h3,.plan.hot .pr b{color:#fff}
  .plan.hot .pd{color:#A9B4D6}.plan.hot ul li{color:#C9D2EC}.plan.hot ul li::before{color:#34D399}
  .hot-b{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#E2B45A,#C98F2B);color:#241A05;font-size:11px;font-weight:800;letter-spacing:.06em;padding:5px 16px;border-radius:999px;box-shadow:0 10px 22px -8px rgba(201,143,43,.7);white-space:nowrap}
  .plan h3{font-size:16px;color:var(--cf-ink-900)}
  .pr{display:flex;align-items:baseline;gap:6px;margin-top:12px}
  .pr b{font-size:38px;font-weight:700;letter-spacing:-.03em;color:var(--cf-ink-900)}
  .pr span{font-size:13.5px;color:var(--cf-ink-400)}
  .plan.hot .pr span{color:#8A97B8}
  .pd{font-size:13px;color:var(--cf-ink-500);margin-top:8px;line-height:1.55}
  .plan ul{list-style:none;padding:0;margin:20px 0 26px;display:grid;gap:11px}
  .plan ul li{position:relative;padding-inline-start:26px;font-size:13.5px;color:var(--cf-ink-600)}
  .plan ul li::before{content:"✓";position:absolute;inset-inline-start:0;color:var(--cf-brand-600);font-weight:800}
  .plan .btn{margin-top:auto;width:100%}
  .pr-more{text-align:center;margin-top:30px}
  .pr-more a{display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:14px}
  .pr-more .material-icons{font-size:17px}
  :host-context([dir=rtl]) .pr-more .material-icons{transform:scaleX(-1)}

  /* faq */
  .faq-sec{max-width:780px;padding-top:30px}
  .faqs{display:grid;gap:12px}
  .faqs details{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:16px;overflow:hidden;transition:border-color .2s}
  .faqs details[open]{border-color:color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line))}
  .faqs summary{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;list-style:none;padding:18px 22px;font-size:15px;font-weight:600;color:var(--cf-ink-900)}
  .faqs summary::-webkit-details-marker{display:none}
  .faqs summary .material-icons{color:var(--cf-ink-400);transition:transform .25s}
  .faqs details[open] summary .material-icons{transform:rotate(180deg);color:var(--cf-brand-600)}
  .faqs details p{padding:0 22px 20px;font-size:14px;color:var(--cf-ink-500);line-height:1.65}

  /* final cta */
  .cta-sec{padding-bottom:110px}
  .cta-box{position:relative;background:#070B17;border-radius:28px;padding:76px 40px;text-align:center;overflow:hidden;isolation:isolate;box-shadow:0 50px 100px -40px rgba(7,11,23,.75)}
  .cta-box .a1{width:480px;height:400px;top:-190px;inset-inline-start:-90px}
  .cta-box .a2{width:430px;height:430px;bottom:-210px;inset-inline-end:-110px}
  .cta-box h2{color:#fff;font-size:clamp(28px,3.8vw,44px);letter-spacing:-.03em;line-height:1.12}
  :host-context([dir=rtl]) .cta-box h2{letter-spacing:0;line-height:1.3}
  .cta-box h2 em{background:linear-gradient(100deg,#E2B45A,#F5DFA8 55%,#E2B45A);-webkit-background-clip:text;background-clip:text;color:transparent}
  .cta-box p{color:#A9B4D6;font-size:16px;margin-top:16px}
  .cta-box .cta{justify-content:center;margin-top:32px}
  .cta-phone{display:inline-flex;align-items:center;gap:11px;margin-top:22px;padding:12px 22px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(52,211,153,.3);color:#D1FAE5;text-decoration:none;font-size:14px;font-weight:500;transition:background .2s,border-color .2s,transform .2s;backdrop-filter:blur(8px)}
  .cta-phone:hover{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.55);transform:translateY(-2px)}
  .cta-phone .material-icons{font-size:18px;color:#34D399}
  .cp-pulse{width:8px;height:8px;border-radius:50%;background:#34D399;box-shadow:0 0 0 0 rgba(52,211,153,.6);animation:pulse 2s infinite;flex:none}
  .cp-text{display:flex;flex-direction:column;align-items:flex-start;gap:1px}
  .cp-text b{font-size:15px;font-weight:700;color:#fff;letter-spacing:.02em}

  @media(max-width:1020px){
    .hero-grid{grid-template-columns:1fr;gap:60px;padding-bottom:70px}
    .stage{max-width:560px;margin:0 auto}
    .wf{grid-template-columns:1fr}
    .rail{flex-direction:row;flex-wrap:wrap;gap:8px}
    .stage-btn{flex:1 1 46%}
    .pane{grid-template-columns:1fr}
    .pane-vis{border-inline-end:0;border-bottom:1px solid var(--cf-line)}
    :host-context([dir=rtl]) .pane-vis{border-inline-start:0}
    .bento{grid-template-columns:1fr 1fr}.bx.big{grid-row:auto}
    .band-in{grid-template-columns:1fr;gap:40px}
    .plans{grid-template-columns:repeat(2,1fr)}
  }
  @media(max-width:640px){
    .plans{grid-template-columns:1fr;max-width:460px;margin:0 auto}
    .hero{padding-top:84px}
    .rail{flex-direction:column}.stage-btn{flex:auto}
    .bento{grid-template-columns:1fr}.bx.wide{grid-column:auto}.bx-2col{grid-template-columns:1fr}
    .sec{padding:70px 20px}.chip{display:none}.proof{gap:16px}
  }
  @media(prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
    .rv{opacity:1;transform:none}
  }
  `],
})
export class HomePage implements OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  /** Same DB-backed catalogue as the Pricing page. */
  plan = inject(PlanService);
  private tloco = inject(TranslocoService);

  /** Translate catalog strings via keyed lookups; fall back to the original English. */
  private tr(key: string, fallback: string): string {
    const v = this.tloco.translate(key);
    return (!v || v === key) ? fallback : v;
  }
  planName(t: PlanTier): string { return this.tr('pricingPage.plan.' + t.name, t.name); }
  planBlurb(t: PlanTier): string { return this.tr('pricingPage.blurb.' + t.id, t.blurb); }
  /** First included feature rows shown as the card bullets. */
  topFeatures(t: PlanTier): PlanFeature[] { return t.features.filter((f) => f.included).slice(0, 4); }
  featText(f: PlanFeature): string {
    const label = this.tr('pricingPage.feat.' + f.label, f.label);
    return f.value ? `${label} (${this.tr('pricingPage.val.' + f.value, f.value)})` : label;
  }

  private rx = signal(0);
  private ry = signal(0);
  certTransform = computed(() => `rotateX(${this.rx()}deg) rotateY(${this.ry()}deg)`);

  tickerKeys = ['tk1', 'tk2', 'tk3', 'tk4', 'tk5', 'tk6'];

  steps: WfStep[] = [
    { n: '01', icon: 'design_services', key: 's1', funcs: ['f1', 'f2', 'f3', 'f4'], props: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] },
    { n: '02', icon: 'bolt', key: 's2', funcs: ['f1', 'f2', 'f3', 'f4'], props: ['p1', 'p2', 'p3', 'p4', 'p5'] },
    { n: '03', icon: 'verified_user', key: 's3', funcs: ['f1', 'f2', 'f3', 'f4'], props: ['p1', 'p2', 'p3', 'p4'] },
    { n: '04', icon: 'send', key: 's4', funcs: ['f1', 'f2', 'f3', 'f4'], props: ['p1', 'p2', 'p3', 'p4'] },
    { n: '05', icon: 'fact_check', key: 's5', funcs: ['f1', 'f2', 'f3', 'f4'], props: ['p1', 'p2', 'p3', 'p4'] },
  ];

  capIcons = [
    { k: 'cap3', i: 'collections_bookmark' }, { k: 'cap2', i: 'data_object' }, { k: 'cap11', i: 'tag' },
    { k: 'cap7', i: 'account_circle' }, { k: 'cap10', i: 'draw' }, { k: 'cap12', i: 'history_edu' },
    { k: 'cap13', i: 'gpp_bad' }, { k: 'cap14', i: 'admin_panel_settings' }, { k: 'cap15', i: 'insights' },
    { k: 'cap16', i: 'palette' }, { k: 'cap17', i: 'qr_code_2' }, { k: 'cap18', i: 'style' },
    { k: 'cap19', i: 'file_download' }, { k: 'cap20', i: 'print' }, { k: 'cap21', i: 'translate' }, { k: 'cap22', i: 'link' }, { k: 'cap23', i: 'verified' },
  ];

  active = signal(0);
  playing = signal(true);
  private timer: any = null;
  private readonly STEP_MS = 6000;

  constructor() {
    afterNextRender(() => {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
        { threshold: 0.12 },
      );
      this.host.nativeElement.querySelectorAll('.rv').forEach((el: Element) => io.observe(el));
      this.startTimer();
    });
  }

  ngOnDestroy(): void { this.clearTimer(); }

  private startTimer(): void {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.clearTimer();
    if (!this.playing()) return;
    this.timer = setInterval(() => this.active.set((this.active() + 1) % this.steps.length), this.STEP_MS);
  }
  private clearTimer(): void { if (this.timer) { clearInterval(this.timer); this.timer = null; } }

  go(i: number): void { this.active.set(i); if (this.playing()) this.startTimer(); }
  togglePlay(): void { this.playing.set(!this.playing()); this.playing() ? this.startTimer() : this.clearTimer(); }
  pause(): void { this.clearTimer(); }
  resume(): void { if (this.playing()) this.startTimer(); }

  tilt(ev: MouseEvent): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stage = (ev.currentTarget as HTMLElement).querySelector('.stage');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    if (ev.clientX < r.left - 80 || ev.clientX > r.right + 80 || ev.clientY < r.top - 80 || ev.clientY > r.bottom + 80) { this.untilt(); return; }
    const px = (ev.clientX - r.left) / r.width - 0.5;
    const py = (ev.clientY - r.top) / r.height - 0.5;
    this.ry.set(px * 14);
    this.rx.set(py * -12);
  }
  untilt(): void { this.rx.set(0); this.ry.set(0); }
}
