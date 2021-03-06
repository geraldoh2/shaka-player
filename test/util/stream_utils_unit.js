/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

describe('StreamUtils', function() {
  var manifest;
  var filterVariantsByLanguageAndRole =
      shaka.util.StreamUtils.filterVariantsByLanguageAndRole;
  var filterStreamsByLanguageAndRole =
      shaka.util.StreamUtils.filterStreamsByLanguageAndRole;

  describe('filterVariantsByLanguageAndRole', function() {
    it('chooses variants in user\'s preferred language', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addVariant(0)
            .language('es')
          .addVariant(1)
            .language('en')
          .addVariant(2)
            .language('en')
        .build();

      var chosen = filterVariantsByLanguageAndRole(
          manifest.periods[0].variants,
          'en',
          '');
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].variants[1]);
      expect(chosen[1]).toBe(manifest.periods[0].variants[2]);
    });

    it('prefers primary variants', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
         .addVariant(0)
            .primary()
         .addVariant(1)
         .addVariant(2)
         .addVariant(3)
            .primary()
        .build();

      var chosen = filterVariantsByLanguageAndRole(
          manifest.periods[0].variants,
          'en',
          '');
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].variants[0]);
      expect(chosen[1]).toBe(manifest.periods[0].variants[3]);
    });

    it('filters out resctricted variants', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addVariant(0)
          .addVariant(1)
          .addVariant(2)
        .build();

      manifest.periods[0].variants[0].allowedByKeySystem = false;
      manifest.periods[0].variants[1].allowedByApplication = false;

      var chosen = filterVariantsByLanguageAndRole(
          manifest.periods[0].variants,
          'en',
          '');
      expect(chosen.length).toBe(1);
      expect(chosen[0]).toBe(manifest.periods[0].variants[2]);
    });

    it('chooses variants in preferred language and role', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addVariant(0)
            .language('en')
            .addAudio(0).roles(['main', 'commentary'])
          .addVariant(1)
            .language('en')
            .addAudio(1).roles(['secondary'])
          .addVariant(2)
            .language('es')
            .addAudio(2).roles(['main'])
        .build();

      var chosen = filterVariantsByLanguageAndRole(
          manifest.periods[0].variants,
          'en',
          'main');
      expect(chosen.length).toBe(1);
      expect(chosen[0]).toBe(manifest.periods[0].variants[0]);
    });

    it('chooses only one role, even if none is preferred', function() {
      // Regression test for https://github.com/google/shaka-player/issues/949
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addVariant(0)
            .language('en')
            .addAudio(0).roles(['commentary'])
          .addVariant(1)
            .language('en')
            .addAudio(1).roles(['commentary'])
          .addVariant(2)
            .language('en')
            .addAudio(2).roles(['secondary'])
          .addVariant(3)
            .language('en')
            .addAudio(3).roles(['secondary'])
          .addVariant(4)
            .language('en')
            .addAudio(4).roles(['main'])
          .addVariant(5)
            .language('en')
            .addAudio(5).roles(['main'])
        .build();

      var chosen = filterVariantsByLanguageAndRole(
          manifest.periods[0].variants,
          'en',
          '');
      // Which role is chosen is an implementation detail.
      // Each role is found on two variants, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].audio.roles[0]).toEqual(chosen[1].audio.roles[0]);
    });

    it('chooses only one role, even if all are primary', function() {
      // Regression test for https://github.com/google/shaka-player/issues/949
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addVariant(0)
            .language('en').primary()
            .addAudio(0).roles(['commentary'])
          .addVariant(1)
            .language('en').primary()
            .addAudio(1).roles(['commentary'])
          .addVariant(2)
            .language('en').primary()
            .addAudio(2).roles(['secondary'])
          .addVariant(3)
            .language('en').primary()
            .addAudio(3).roles(['secondary'])
          .addVariant(4)
            .language('en').primary()
            .addAudio(4).roles(['main'])
          .addVariant(5)
            .language('en').primary()
            .addAudio(5).roles(['main'])
        .build();

      var chosen = filterVariantsByLanguageAndRole(
          manifest.periods[0].variants,
          'zh',
          '');
      // Which role is chosen is an implementation detail.
      // Each role is found on two variants, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].audio.roles[0]).toEqual(chosen[1].audio.roles[0]);
    });

    it('chooses only one language, even if all are primary', function() {
      // Regression test for https://github.com/google/shaka-player/issues/918
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addVariant(0)
            .language('en').primary()
            .addAudio(0)
          .addVariant(1)
            .language('en').primary()
            .addAudio(1)
          .addVariant(2)
            .language('es').primary()
            .addAudio(2)
          .addVariant(3)
            .language('es').primary()
            .addAudio(3)
        .build();

      var chosen = filterVariantsByLanguageAndRole(
          manifest.periods[0].variants,
          'zh',
          '');
      // Which language is chosen is an implementation detail.
      // Each role is found on two variants, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].language).toEqual(chosen[1].language);
    });

    it('chooses a role from among primary variants without language match',
        function() {
          manifest = new shaka.test.ManifestGenerator()
            .addPeriod(0)
              .addVariant(0)
                .language('en').primary()
                .addAudio(0).roles(['commentary'])
              .addVariant(1)
                .language('en').primary()
                .addAudio(1).roles(['commentary'])
              .addVariant(2)
                .language('en')
                .addAudio(2).roles(['secondary'])
              .addVariant(3)
                .language('en')
                .addAudio(3).roles(['secondary'])
              .addVariant(4)
                .language('en').primary()
                .addAudio(4).roles(['main'])
              .addVariant(5)
                .language('en').primary()
                .addAudio(5).roles(['main'])
            .build();

          var chosen = filterVariantsByLanguageAndRole(
              manifest.periods[0].variants,
              'zh',
              '');
          // Which role is chosen is an implementation detail.
          // Each role is found on two variants, so we should have two.
          expect(chosen.length).toBe(2);
          expect(chosen[0].audio.roles[0]).toEqual(chosen[1].audio.roles[0]);

          // Since nothing matches our language preference, we chose primary
          // variants.
          expect(chosen[0].primary).toBe(true);
          expect(chosen[1].primary).toBe(true);
        });

    it('chooses a role from best language match, in spite of primary',
        function() {
          manifest = new shaka.test.ManifestGenerator()
            .addPeriod(0)
              .addVariant(0)
                .language('en').primary()
                .addAudio(0).roles(['commentary'])
              .addVariant(1)
                .language('en').primary()
                .addAudio(1).roles(['commentary'])
              .addVariant(2)
                .language('zh')
                .addAudio(2).roles(['secondary'])
              .addVariant(3)
                .language('zh')
                .addAudio(3).roles(['secondary'])
              .addVariant(4)
                .language('en').primary()
                .addAudio(4).roles(['main'])
              .addVariant(5)
                .language('en').primary()
                .addAudio(5).roles(['main'])
            .build();

          var chosen = filterVariantsByLanguageAndRole(
              manifest.periods[0].variants,
              'zh',
              '');
          expect(chosen.length).toBe(2);
          expect(chosen[0].language).toBe('zh');
          expect(chosen[1].language).toBe('zh');
          expect(chosen[0].primary).toBe(false);
          expect(chosen[1].primary).toBe(false);
        });
  });

  describe('filterStreamsByLanguageAndRole', function() {
    it('chooses text streams in user\'s preferred language', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(1)
            .language('en')
          .addTextStream(2)
            .language('es')
          .addTextStream(3)
            .language('en')
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].textStreams[0]);
      expect(chosen[1]).toBe(manifest.periods[0].textStreams[2]);
    });

    it('chooses primary text streams', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(1)
          .addTextStream(2)
            .primary()
          .addTextStream(3)
            .primary()
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].textStreams[1]);
      expect(chosen[1]).toBe(manifest.periods[0].textStreams[2]);
    });

    it('chooses text streams in preferred language and role', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(1)
            .language('en')
            .roles(['main', 'commentary'])
          .addTextStream(2)
            .language('es')
          .addTextStream(3)
            .language('en')
            .roles(['caption'])
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          'main');
      expect(chosen.length).toBe(1);
      expect(chosen[0]).toBe(manifest.periods[0].textStreams[0]);
    });

    it('prefers no-role streams if there is no preferred role', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(0)
            .language('en')
            .roles(['commentary'])
          .addTextStream(1)
            .language('en')
          .addTextStream(2)
            .language('en')
            .roles(['secondary'])
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      expect(chosen.length).toBe(1);
      expect(chosen[0].roles.length).toBe(0); // Pick a stream with no role.
    });

    it('ignores no-role streams if there is a preferred role', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(0)
            .language('en')
            .roles(['commentary'])
          .addTextStream(1)
            .language('en')
          .addTextStream(2)
            .language('en')
            .roles(['secondary'])
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          'main'); // A role that is not present.
      expect(chosen.length).toBe(1);
      expect(chosen[0].roles.length).toBe(1); // Pick a stream with a role.
    });

    it('chooses only one role, even if none is preferred', function() {
      // Regression test for https://github.com/google/shaka-player/issues/949
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(0)
            .language('en')
            .roles(['commentary'])
          .addTextStream(1)
            .language('en')
            .roles(['commentary'])
          .addTextStream(2)
            .language('en')
            .roles(['secondary'])
          .addTextStream(3)
            .language('en')
            .roles(['secondary'])
          .addTextStream(4)
            .language('en')
            .roles(['main'])
          .addTextStream(5)
            .language('en')
            .roles(['main'])
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      // Which role is chosen is an implementation detail.
      // Each role is found on two text streams, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].roles[0]).toEqual(chosen[1].roles[0]);
    });

    it('chooses only one role, even if all are primary', function() {
      // Regression test for https://github.com/google/shaka-player/issues/949
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(0)
            .language('en').primary()
            .roles(['commentary'])
          .addTextStream(1)
            .language('en').primary()
            .roles(['commentary'])
          .addTextStream(2)
            .language('en').primary()
            .roles(['secondary'])
          .addTextStream(3)
            .language('en').primary()
            .roles(['secondary'])
          .addTextStream(4)
            .language('en').primary()
            .roles(['main'])
          .addTextStream(5)
            .language('en').primary()
            .roles(['main'])
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'zh',
          '');
      // Which role is chosen is an implementation detail.
      // Each role is found on two text streams, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].roles[0]).toEqual(chosen[1].roles[0]);
    });

    it('chooses only one language, even if all are primary', function() {
      // Regression test for https://github.com/google/shaka-player/issues/918
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(0)
            .language('en').primary()
          .addTextStream(1)
            .language('en').primary()
          .addTextStream(2)
            .language('es').primary()
          .addTextStream(3)
            .language('es').primary()
        .build();

      var chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'zh',
          '');
      // Which language is chosen is an implementation detail.
      // Each role is found on two variants, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].language).toEqual(chosen[1].language);
    });

    it('chooses a role from among primary streams without language match',
        function() {
          manifest = new shaka.test.ManifestGenerator()
            .addPeriod(0)
              .addTextStream(0)
                .language('en').primary()
                .roles(['commentary'])
              .addTextStream(1)
                .language('en').primary()
                .roles(['commentary'])
              .addTextStream(2)
                .language('en')
                .roles(['secondary'])
              .addTextStream(3)
                .language('en')
                .roles(['secondary'])
              .addTextStream(4)
                .language('en').primary()
                .roles(['main'])
              .addTextStream(5)
                .language('en').primary()
                .roles(['main'])
            .build();

          var chosen = filterStreamsByLanguageAndRole(
              manifest.periods[0].textStreams,
              'zh',
              '');
          // Which role is chosen is an implementation detail.
          // Each role is found on two text streams, so we should have two.
          expect(chosen.length).toBe(2);
          expect(chosen[0].roles[0]).toEqual(chosen[1].roles[0]);

          // Since nothing matches our language preference, we chose primary
          // text streams.
          expect(chosen[0].primary).toBe(true);
          expect(chosen[1].primary).toBe(true);
        });

    it('chooses a role from best language match, in spite of primary',
        function() {
          manifest = new shaka.test.ManifestGenerator()
            .addPeriod(0)
              .addTextStream(0)
                .language('en').primary()
                .roles(['commentary'])
              .addTextStream(1)
                .language('en').primary()
                .roles(['commentary'])
              .addTextStream(2)
                .language('zh')
                .roles(['secondary'])
              .addTextStream(3)
                .language('zh')
                .roles(['secondary'])
              .addTextStream(4)
                .language('en').primary()
                .roles(['main'])
              .addTextStream(5)
                .language('en').primary()
                .roles(['main'])
            .build();

          var chosen = filterStreamsByLanguageAndRole(
              manifest.periods[0].textStreams,
              'zh',
              '');
          expect(chosen.length).toBe(2);
          expect(chosen[0].language).toBe('zh');
          expect(chosen[1].language).toBe('zh');
          expect(chosen[0].primary).toBe(false);
          expect(chosen[1].primary).toBe(false);
        });

  });

  describe('filterNewPeriod', function() {
    var fakeDrmEngine;

    beforeAll(function() {
      fakeDrmEngine = new shaka.test.FakeDrmEngine();
    });

    it('filters text streams with the full MIME type', function() {
      manifest = new shaka.test.ManifestGenerator()
        .addPeriod(0)
          .addTextStream(1).mime('text/vtt')
          .addTextStream(2).mime('application/mp4', 'wvtt')
          .addTextStream(3).mime('text/bogus')
          .addTextStream(4).mime('application/mp4', 'bogus')
        .build();

      var noAudio = null;
      var noVideo = null;
      shaka.util.StreamUtils.filterNewPeriod(
          fakeDrmEngine, noAudio, noVideo, manifest.periods[0]);

      // Covers a regression in which we would remove streams with codecs.
      // The last two streams should be removed because their full MIME types
      // are bogus.
      expect(manifest.periods[0].textStreams.length).toBe(2);
      var textStreams = manifest.periods[0].textStreams;
      expect(textStreams[0].id).toBe(1);
      expect(textStreams[1].id).toBe(2);
    });
  });
});
