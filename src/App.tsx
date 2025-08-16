/* eslint-disable react-hooks/exhaustive-deps */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import "./App.css";
import { defaultData } from "./constants";
import { useDropbox } from "./useDropbox";

export function App() {
  const [disabled, setDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [originalData, setOriginalData] = useState(defaultData);
  const [formData, setFormData] = useState(defaultData);

  useLayoutEffect(() => {
    setErrorMessage(undefined);
  }, [formData, originalData]);

  const { signIn, signOut, isSignedIn, loadData, saveData } = useDropbox();

  const performAction = useCallback(
    async (action: () => Promise<void>): Promise<void> => {
      setDisabled(true);
      setErrorMessage(undefined);
      try {
        await action();
      } catch (error) {
        setErrorMessage((error as Error).message);
      } finally {
        setDisabled(false);
      }
    },
    []
  );

  // Load initial data when signed in:
  useEffect(() => {
    if (isSignedIn) {
      performAction(async () => {
        const data = await loadData();
        setOriginalData(data);
        setFormData(data);
      });
    }
  }, [isSignedIn]);

  const hasChanges = useMemo(
    () => JSON.stringify(originalData) !== JSON.stringify(formData),
    [originalData, formData]
  );

  const appClassName = ["app", disabled && "app-disabled"]
    .filter(Boolean)
    .join(" ");

  if (!isSignedIn) {
    return (
      <div className={appClassName}>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <div className="sign-in-container">
          <h1>Share Holders</h1>
          <button
            className="primary-button"
            onClick={() => performAction(signIn)}
            disabled={disabled}
          >
            Sign in with Dropbox
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={appClassName}>
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <header className="app-header">
        <h1>Share Holders</h1>
        <button
          className="secondary-button"
          onClick={() => performAction(async () => signOut())}
          disabled={disabled}
        >
          Sign out
        </button>
      </header>

      <form className="data-form" onSubmit={(event) => event.preventDefault()}>
        <div className="form-section">
          <div className="input-group">
            <label htmlFor="totalInvestment">Total Investment</label>
            <input
              id="totalInvestment"
              type="number"
              step="10000"
              placeholder="0"
              value={formData.totalInvestment}
              onInput={(event) => {
                const totalInvestment =
                  parseFloat(event.currentTarget.value) || 0;
                console.log(event.currentTarget.value, totalInvestment);
                setFormData((current) => ({
                  ...current,
                  totalInvestment,
                }));
              }}
              disabled={disabled}
            />
          </div>

          <div className="input-group">
            <label htmlFor="currentValuation">Current Valuation</label>
            <input
              id="currentValuation"
              type="number"
              step="10000"
              placeholder="0"
              value={formData.currentValuation}
              onInput={(event) => {
                const currentValuation =
                  parseFloat(event.currentTarget.value) || 0;
                setFormData((current) => ({
                  ...current,
                  currentValuation,
                }));
              }}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Share Holders</h2>
            <button
              type="button"
              className="add-button"
              onClick={() => {
                setFormData((current) => ({
                  ...current,
                  shareHolders: [
                    ...current.shareHolders,
                    { name: "", shareRatio: 0 },
                  ],
                }));
              }}
              disabled={disabled}
            >
              Add
            </button>
          </div>

          <div className="shareholders-list">
            {formData.shareHolders.map((shareHolder, index) => (
              <div key={index} className="shareholder-item">
                <div className="shareholder-header">
                  <div className="input-group">
                    <label htmlFor={`name-${index}`}>Name</label>
                    <div className="input-with-button-group">
                      <input
                        id={`name-${index}`}
                        type="text"
                        value={shareHolder.name}
                        onInput={(event) => {
                          const name = event.currentTarget.value;
                          setFormData((current) => ({
                            ...current,
                            shareHolders: current.shareHolders.map((s, i) =>
                              i === index ? { ...s, name } : s
                            ),
                          }));
                        }}
                        disabled={disabled}
                        placeholder="Shareholder name"
                      />
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => {
                          setFormData((current) => ({
                            ...current,
                            shareHolders: current.shareHolders.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                        disabled={disabled}
                        title="Remove shareholder"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>

                <div className="shareholder-details">
                  <div className="input-group">
                    <label htmlFor={`share-${index}`}>Share</label>
                    <input
                      id={`share-${index}`}
                      type="text"
                      value={`${(
                        shareHolder.shareRatio * formData.currentValuation
                      ).toFixed(0)} : ${(shareHolder.shareRatio * 100).toFixed(
                        2
                      )}%`}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor={`invest-${index}`}>Invest Amount</label>
                    <div className="input-with-button-group">
                      <input
                        id={`invest-${index}`}
                        type="number"
                        step="10000"
                        placeholder="0"
                        disabled={disabled}
                      />
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={disabled}
                        onClick={() => {
                          const investInput = document.getElementById(
                            `invest-${index}`
                          ) as HTMLInputElement;
                          const investAmount =
                            parseFloat(investInput.value) || 0;
                          if (!investAmount) return;
                          const newValuation =
                            formData.currentValuation + investAmount;
                          setFormData((current) => ({
                            ...current,
                            totalInvestment:
                              current.totalInvestment + investAmount,
                            currentValuation: newValuation,
                            shareHolders: current.shareHolders.map((s, i) => ({
                              ...s,
                              shareRatio:
                                (s.shareRatio * current.currentValuation +
                                  (i === index ? investAmount : 0)) /
                                newValuation,
                            })),
                          }));
                          investInput.value = "";
                        }}
                      >
                        Invest
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              performAction(async () => {
                const data = await loadData();
                setOriginalData(data);
                setFormData(data);
              });
            }}
            disabled={disabled}
          >
            Refresh
          </button>
          <button
            type="submit"
            className="primary-button"
            onClick={() => {
              performAction(async () => {
                await saveData(formData);
                setOriginalData(formData);
              });
            }}
            disabled={disabled || !hasChanges}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
