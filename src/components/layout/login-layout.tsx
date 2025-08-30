"use client";

import React, { ReactNode } from "react";
import { Theme, Grid, Column, Tile } from "@carbon/react";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { AbstractInfographic } from "@/components/ui/abstract-infographic";
import { useTranslations } from "next-intl";
import { useLanguageFont } from "@/shared/hooks/use-language-font";
import { useUIStore } from "@/stores/ui-store";

interface LoginLayoutProps {
  children: ReactNode;
}

export const LoginLayout: React.FC<LoginLayoutProps> = ({ children }) => {
  const footerT = useTranslations();
  const { isNepali } = useLanguageFont();
  const { theme } = useUIStore();

  return (
    <Theme theme={theme}>
      <Grid fullWidth narrow>
        {/* Header */}
        <Column lg={16} md={8} sm={4}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--cds-ui-03)"
          }}>
            <h1 style={{ margin: 0 }} className="font-dynamic">iCMS</h1>
            <LanguageSwitcher variant="button" showLabels={false} />
          </div>
        </Column>

        {/* Main */}
        <Column lg={8} md={8} sm={4}>
          <Tile style={{ margin: "2rem 1.5rem" }}>
            {children}
          </Tile>
        </Column>

        <Column lg={8} md={8} sm={4}>
          <Tile style={{ margin: "2rem 1.5rem", minHeight: "24rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AbstractInfographic  />
          </Tile>
        </Column>

        {/* Footer */}
        <Column lg={16} md={8} sm={4}>
          <div style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--cds-ui-03)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <span className="font-dynamic">{footerT("contact")}</span>
              <span className="font-dynamic">{footerT("privacy")}</span>
              <span className="font-dynamic">{footerT("termsOfUse")}</span>
              <span className="font-dynamic">{footerT("accessibility")}</span>
              <span className="font-dynamic">{footerT("cookiePreferences")}</span>
            </div>
            <div className="font-dynamic">{footerT("poweredBy")}</div>
          </div>
        </Column>
      </Grid>
    </Theme>
  );
};
